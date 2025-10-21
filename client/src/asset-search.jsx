import React from 'react';
import { useState, useEffect } from 'react';
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
  const [chartData, setChartData] = useState(null)


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

useEffect(() => {
    if (loaded && data && data.length > 0) {

      const labels = data[0].data.map(entry => {
        const [ano, mes, dia] = entry.date.split('-')
        return `${dia}/${mes}/${ano}`        
      }).reverse(); //garantir ordem cronologica

      const datasets = data.map((assetData, index) => ({
        label: `${assetData.asset} Closing Prices`, 
        data: assetData.data.map(entry => entry.closeValue).reverse(), //garantir ordem cronologica
        fill: false,
        borderColor: `hsl(${(index * 60) % 360}, 70%, 50%)`, //garantir cores diferentes para as linhas
      }));

      setChartData({
        labels: labels,
        datasets: datasets
      });
    }
  }, [data, loaded]);

  return (  // formatação somente para testes iniciais, trabalhar na estilização depois
    <>
    <div className="form-container">
      <h1>Busca de Ativos B3</h1>
      <Form onSubmit={handleSubmit}>
        {inputFields.map(field => (
          <div className="input-group" key={field.id}>
            <input
              type="text"
              value={field.value}
              onChange={event => handleChange(field.id, event)}
              placeholder="Símbolo do ativo"
              required
            />
          </div>
        ))}
          <Button type="button" variant='secondary' className="add-button" onClick={handleAddField}>
            +
          </Button>

        <Form.Group controlId='formDates'>
            <Form.Label>Data de início da consulta:</Form.Label>
              <Form.Control 
                type='date' 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
              />
            <Form.Label>Data de fim da consulta:</Form.Label>
              <Form.Control 
                type='date' 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
              />
        </Form.Group>

        <Form.Group controlId='formButtons'>

          <Button type="submit" variant='primary' className="submit-button">Pesquisar!</Button>
        </Form.Group>
      </Form>

      <Container> {/*dados unificados em um grafico*/ }
        {loaded && chartData && (
          <>
          <h3>{data.map(assetData => assetData.asset).join(', ')}</h3>
          <Line data={chartData}></Line>
          </>
        )}
    </Container> 
    </div>
    </>
  );
}