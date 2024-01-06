import React, { useState } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import axios from 'axios';

const BotGUI = () => {
    const [configuration, setConfiguration] = useState({
        name: '',
        options: '',
        timeout: '',
        links: '',
    });

    const handleChange = (prop) => (event) => {
        setConfiguration({ ...configuration, [prop]: event.target.value });
    };

        // Aquí manejarías la lógica de envío de la configuración, como enviarla al backend
        const handleSubmit = () => {
            // Usar Axios para enviar la configuración al servidor
            axios.post('http://localhost:3001/api/configuracion', configuration)
                .then(response => {
                    console.log('Success:', response.data);
                    // Manejar la respuesta exitosa aquí
                })
                .catch(error => {
                    console.error('Error:', error);
                    // Manejar los errores aquí
                });
        };

    return (
        <div>
            <Accordion>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1a-content"
                    id="panel1a-header"
                >
                    <Typography>Nombre</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <TextField
                        label="Nombre del Bot"
                        variant="outlined"
                        fullWidth
                        value={configuration.name}
                        onChange={handleChange('name')}
                    />
                </AccordionDetails>
            </Accordion>

            <Accordion>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel2a-content"
                    id="panel2a-header"
                >
                    <Typography>Opciones</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <TextField
                        label="Opciones del Menú"
                        variant="outlined"
                        fullWidth
                        multiline
                        rows={4}
                        value={configuration.options}
                        onChange={handleChange('options')}
                    />
                </AccordionDetails>
            </Accordion>

            <Accordion>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel3a-content"
                    id="panel3a-header"
                >
                    <Typography>Timeout</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <TextField
                        label="Timeout (en segundos)"
                        variant="outlined"
                        fullWidth
                        value={configuration.timeout}
                        onChange={handleChange('timeout')}
                    />
                </AccordionDetails>
            </Accordion>

            <Accordion>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel4a-content"
                    id="panel4a-header"
                >
                    <Typography>Links</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <TextField
                        label="Links útiles"
                        variant="outlined"
                        fullWidth
                        multiline
                        rows={2}
                        value={configuration.links}
                        onChange={handleChange('links')}
                    />
                </AccordionDetails>
            </Accordion>

            <Button variant="contained" color="primary" onClick={handleSubmit}>
                Guardar Configuración
            </Button>
        </div>
    );
};

export default BotGUI;
