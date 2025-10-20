import React from 'react';
import { useState } from 'react';
import { Form, Button, Container } from 'react-bootstrap';
import api from './services/api';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function SearchAsset () {

  const assets = []

  const [inputFields, setInputFields] = useState([ // estado inicial com um campo vazio e id 1
      { id: 1, value: '' }
    ]);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');  

  const handleChange = (id, event) => {
    const newInputField = inputFields.map(field => {
      if (id === field.id) {
        return { ...field, value: event.target.value };
      }
      return field;
    });

    setInputFields(newInputField);
  };


  const handleAddField = () => {
    const newField = { id: Date.now(), value: '' }; 
    setInputFields([...inputFields, newField]);
  };
  
  const handleSubmit = async (event) => {
    event.preventDefault(); // prevenir comportamento padrão do form (reload da página)
    assets.push(inputFields.map(field => field.value)); // extrair os valores dos campos
    
    await api.post('/submit', { //to do: error handling
      assetArray: assets,
      startDate,
      endDate
    })

    //console.log('Data inicio:', startDate);
    //console.log('Data fim:', endDate);
  };

  return (  // formatação somente para testes iniciais, trabalhar na estilização depois
    <>
    <div className="form-container">
      <h1>Busca de Assets</h1>
      <Form onSubmit={handleSubmit}>
        {inputFields.map(field => (
          <div className="input-group" key={field.id}>
            <input
              type="text"
              value={field.value}
              onChange={event => handleChange(field.id, event)}
              placeholder="Enter a value"
              required
            />
          </div>
        ))}

        <Form.Group controlId='formDates'>
            <Form.Label>Data de Início:</Form.Label>
              <Form.Control 
                type='date' 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
              />
            <Form.Label>Data de Fim:</Form.Label>
              <Form.Control 
                type='date' 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
              />
        </Form.Group>

        <Form.Group controlId='formButtons'>
          <Button type="button" variant='secondary' className="add-button" onClick={handleAddField}>
            +
          </Button>
          <Button type="submit" variant='primary' className="submit-button">Pesquisar!</Button>
        </Form.Group>
      </Form>
    </div>
    </>
  );
}