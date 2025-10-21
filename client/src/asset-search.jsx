import React from 'react';
import { useState } from 'react';
import { Form, Button, Container } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS}  from 'chart.js/auto';
import api from './services/api';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function SearchAsset () {

  const [inputFields, setInputFields] = useState([ // estado inicial com um campo vazio e id 1
      { id: 1, value: '' }
    ]);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState([]);
  const [loaded, setLoaded] = useState(false);


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
    const assets = (inputFields.map(field => field.value)); // extrair os valores dos campos
    try {    
      const response = await api.post('/submit', { 
      assetArray: assets,
      startDate,
      endDate
    })
    console.log('Response from server:', response.data.data);
    setData(response.data.data);
    setLoaded(true);
    } catch (error) {
      console.error('Error submitting data to server:', error);
    }

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

      <Container> {/*teste de visualizacao inicial em charts, ainda nao refinado para um chart so com linhas diferentes*/ }
        {loaded && data && (
          data.map((assetData) => {
            const chartData = {
              labels: assetData.data.map(entry => entry.date).reverse(),
              datasets: [
                {
                  label: `${assetData.asset} Closing Prices`,
                  data: assetData.data.map(entry => entry.closeValue).reverse(),
                  fill: false,
                  borderColor: 'rgba(75,192,192,1)',
                  tension: 0.1
                }
              ]
            };
            return (
              <div key={assetData.asset} className="chart-container">
                <h3>{assetData.asset}</h3>
                <Line data={chartData} />
              </div>
            );
          })
        )}
    </Container> 
    </div>
    </>
  );
}