//Flowchart.jsx

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
import toast from 'react-hot-toast';

const EditableNode = ({ id, data }) => {
    const [label, setLabel] = useState(data.label);

    const handleInputChange = (evt) => {
        setLabel(evt.target.value);
        data.onChange(id, evt.target.value);
    };

    // Agrega esta línea para acceder a la función de eliminación
    const { onDelete } = data;

    return (
        <div style={{ border: '1px solid #777', padding: '10px', background: 'white' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>BotName</div>
            <input type="text" value={label} onChange={handleInputChange} />
            <button onClick={() => onDelete(id)}>Eliminar</button>
            <Handle type="target" position="top" />
            <Handle type="source" position="bottom" />
        </div>
    );
};

const updateNodeConfig = (nodes, edges) => {
    axios.post('http://localhost:3001/api/update-nodes', { nodes, edges })
        .then(response => {
            toast.success('Configuración de nodos y conexiones actualizada!');
        })
        .catch(error => {
            console.error('Error al actualizar nodos y conexiones:', error);
            toast.error('Error al actualizar nodos y conexiones.');
        });
};
const OptionsNode = ({ id, data, onChange }) => {
    const handleChange = (e) => {
        const newText = e.target.value;
        onChange(id, newText);
    };

    // Extraer el número del nodo del ID
    const optionNumber = id.split('_').pop();

    return (
        <div style={{ border: '1px solid #777', padding: '10px', background: 'white' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Option {data.order}</div>
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

const nodeTypes = {
    editableNode: EditableNode,
    optionsNode: OptionsNode, // Assuming OptionsNode is also a component like EditableNode
};



export default function Flow() {

    const handleDeleteNode = useCallback((nodeId) => {
        setNodes((currentNodes) => currentNodes.filter((node) => node.id !== nodeId));
    }, []);

    const handleSave = () => {
        updateNodeConfig(nodes, edges);
    };


    const addOptionsNode = () => {
        // Contar los nodos de opción que ya están conectados a un nodo de menú
        let optionsNodeCount = 0;
        nodes.forEach((node) => {
            if (node.type === 'optionsNode' && edges.some(edge => edge.source === node.id || edge.target === node.id)) {
                optionsNodeCount++;
            }
        });

        const newNode = {
            id: `options_node_${nodes.length + 1}`,
            type: 'optionsNode',
            position: { x: 250, y: 250 },
            data: { text: '', tipo: 'optionsNode', order: optionsNodeCount + 1 } // Agregar propiedad 'order'
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
            toast.error("Nodo 'BotName' no encontrado.");
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
            .then(response => {
                console.log(response.data);
                toast.success('Cambios guardados con éxito!');
            })
            .catch(error => {
                console.error('Error:', error);
                toast.error('Error al guardar los cambios.');
            });
    }, [nodes]);


    const handleNodeLabelChange = useCallback((nodeId, newLabel) => {
        setNodes((nds) => nds.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, label: newLabel } } : node));
    }, []);

    const addNode = () => {
        // Encuentra el nodo "Start"
        const startNode = nodes.find(node => node.id === '1');

        if (!startNode) {
            console.log("Nodo 'Start' no encontrado.");
            toast.error("Nodo 'Start' no encontrado.");
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
            data: {
                label: 'Nuevo Nodo',
                tipo: 'bot',
                onChange: handleNodeLabelChange,
                onDelete: handleDeleteNode  // Asegúrate de pasar la función aquí
            },
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




    useEffect(() => {
        axios.get('http://localhost:3001/api/get-nodes')
            .then(response => {
                const { nodes, edges } = response.data;
                if (nodes && edges) {
                    // Agrega onDelete a cada nodo
                    const updatedNodes = nodes.map(node => ({
                        ...node,
                        data: { ...node.data, onDelete: handleDeleteNode }
                    }));
                    setNodes(updatedNodes);
                    setEdges(edges);
                }
            })
            .catch(error => {
                console.error('Error al cargar nodos y conexiones:', error);
            });
    }, []);




    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <div style={{ position: 'absolute', zIndex: 4, display: 'flex' }}>
                <button onClick={addNode}>Agregar Nombre</button>
                <button onClick={addOptionsNode}>Agregar Nodo Options</button>
            </div>
            <div style={{ position: 'absolute', right: 0, top: 0, zIndex: 4 }}>
                <button onClick={handleSave}>Guardar Cambios</button>
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

