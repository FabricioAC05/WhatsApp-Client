import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    applyNodeChanges,
    applyEdgeChanges,
    Handle,
    addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomEdge from './ButtonEdge.tsx';
import axios from 'axios';

const EditableNode = ({ id, data }) => {
    const [label, setLabel] = useState(data.label);

    const handleInputChange = (evt) => {
        setLabel(evt.target.value);
        data.onChange(id, evt.target.value);
    };

    return (
        <div style={{ border: '1px solid #777', padding: '10px', background: 'white' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>BotName</div>
            <input type="text" value={label} onChange={handleInputChange} />
            <Handle type="target" position="top" />
            <Handle type="source" position="bottom" />
        </div>
    );
};


const OptionsNode = ({ id, data, onChange }) => {
    const handleChange = (e) => {
        const newText = e.target.value;
        // Llama a la función onChange que actualizará el estado global de los nodos
        onChange(id, newText);
    };

    return (
        <div style={{ border: '1px solid #777', padding: '10px', background: 'white' }}>
            <input type="text" value={data.text} onChange={handleChange} />
            <Handle type="target" position="top" />
            <Handle type="source" position="bottom" />
        </div>
    );
};







// Definir nodeTypes y edgeTypes fuera del componente
const edgeTypes = {
    custom: CustomEdge,
};


export default function Flow() {






    const addOptionsNode = () => {
        const newNode = {
            id: `options_node_${nodes.length + 1}`,
            type: 'optionsNode',
            position: { x: 250, y: 250 },
            data: { text: '', tipo: 'optionsNode' } // Asegúrate de que el tipo sea 'optionsNode'
        };
        setNodes((currentNodes) => [...currentNodes, newNode]);
    };



    const [nodes, setNodes] = useState([
        { id: '1', type: 'input', position: { x: 0, y: 0 }, data: { label: 'Start' } },
        { id: '2', position: { x: 100, y: 100 }, data: { label: 'Finish' } },
        { id: '3', position: { x: 50, y: 50 }, data: { label: 'Menu', tipo: 'menu' } },
    ]);



    const [edges, setEdges] = useState([]);


    const onConnect = useCallback((params) => {
        // Asegúrate de que los bordes nuevos usen el tipo 'custom'
        setEdges((eds) => addEdge({ ...params, type: 'custom' }, eds));
    }, []);

    const saveChanges = useCallback(() => {
        const botNode = nodes.find(node => node.data.tipo === 'bot');
        const menuNode = nodes.find(node => node.data.tipo === 'menu');
        if (!botNode || !menuNode) {
            console.error("Nodo 'BotName' o 'Menu' no encontrado.");
            return;
        }

        const connectedOptions = nodes
            .filter(node => node.data.tipo === 'optionsNode') // Asegúrate de filtrar por 'tipo'
            .map(node => node.data.text)
            .filter(text => text.trim() !== ''); // Filtra las opciones vacías

        const configuracionBot = {
            name: botNode.data.label,
            options: connectedOptions.join('\n')
        };

        axios.post('http://localhost:3001/api/configuracion', configuracionBot)
            .then(response => console.log(response.data))
            .catch(error => console.error('Error:', error));
    }, [nodes]);


    const handleNodeLabelChange = useCallback((nodeId, newLabel) => {
        setNodes((nds) => nds.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, label: newLabel } } : node));
    }, []);

    const addNode = () => {
        // Encuentra el nodo "Start"
        const startNode = nodes.find(node => node.id === '1');

        if (!startNode) {
            console.log("Nodo 'Start' no encontrado.");
            return;
        }

        // Calcula la posición del nuevo nodo. Por ejemplo, 100 píxeles debajo del nodo "Start"
        const newPosition = {
            x: startNode.position.x,
            y: startNode.position.y + 100
        };

        const newNode = {
            id: `node_${nodes.length + 1}`,
            position: newPosition,
            data: { label: 'Nuevo Nodo', tipo: 'bot', onChange: handleNodeLabelChange },
            type: 'editableNode',
        };
        setNodes((nds) => nds.concat(newNode));
    };

    const getNodeTypes = () => ({
        editableNode: EditableNode,
        optionsNode: (props) => <OptionsNode {...props} onChange={handleOptionTextChange} />,
    });


    const [nodeTypes, setNodeTypes] = useState(() => getNodeTypes(setNodes));

    useEffect(() => {
        setNodeTypes(getNodeTypes(setNodes));
    }, [setNodes]);

    const saveAllChangesLocally = useCallback(() => {
        // Recorre todos los nodos y actualiza el estado con el valor actual del campo de texto
        const updatedNodes = nodes.map(node => {
            // Suponemos que solo quieres actualizar los nodos de tipo 'optionsNode'
            if (node.type === 'optionsNode') {
                const inputElement = document.querySelector(`input[data-nodeid="${node.id}"]`);
                if (inputElement) {
                    // Actualiza la propiedad text del nodo con el valor del campo de texto
                    return {
                        ...node,
                        data: { ...node.data, text: inputElement.value }
                    };
                }
            }
            // Para todos los demás nodos, no cambiamos nada
            return node;
        });

        // Actualiza el estado de los nodos con los nodos actualizados
        setNodes(updatedNodes);
    }, [nodes, setNodes]);

    const handleOptionTextChange = useCallback((nodeId, newText) => {
        setNodes((currentNodes) => currentNodes.map((node) => {
            if (node.id === nodeId) {
                // Solo actualiza el nodo que ha cambiado
                return { ...node, data: { ...node.data, text: newText } };
            }
            return node;
        }));
    }, [setNodes]);

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <div style={{ position: 'absolute', zIndex: 4, display: 'flex' }}>
                <button onClick={addNode}>Agregar Nombre</button>
                <button onClick={addOptionsNode}>Agregar Nodo Options</button>
            </div>
            <div style={{ position: 'absolute', right: 0, top: 0, zIndex: 4 }}>
                <button onClick={saveAllChangesLocally} style={{ marginRight: '80px' }}>Guardar todos los cambios</button>
                <button onClick={saveChanges}>Enviar Cambios</button>
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodesChange={useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), [])}
                onEdgesChange={useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), [])}
                onConnect={onConnect}
                fitView
            >
                <MiniMap />
                <Controls />
                <Background />
            </ReactFlow>
        </div>
    );
}

