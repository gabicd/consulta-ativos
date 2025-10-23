import React from 'react';
import { useState, useEffect, createRef } from 'react';
import { Form, Button, Container, Spinner, Modal, Stack, } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS}  from 'chart.js/auto';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import api from './services/api';
import logo from './assets/inoa-logo.png';
import 'bootstrap/dist/css/bootstrap.min.css';
import './asset-search.css'

export default function SearchAsset () {
  const [inputFields, setInputFields] = useState([{ id: 1, value: '', ref: createRef(null) }]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState([]);
  const [searching, setSearching] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [show, setShow] = useState(false)
  const [showError, setShowError] = useState(false)
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
    const newField = { id: Date.now(), value: '', ref: createRef(null)}; 
    setInputFields([...inputFields, newField]);
  };  

  const handleDeleteField = (id) => {  
    if (inputFields.length == 1){
      setShow(true) 
      return
    } 
    const updatedInputFields = inputFields.filter(field => field.id != id);
    setInputFields(updatedInputFields);
  }
  
  const handleSubmit = async (event) => {
    event.preventDefault(); 
    const assets = (inputFields.map(field => ((field.value).toUpperCase()).trim())); 
      try {
        setSearching(true)    
        const response = await api.post('/submit', { 
        assetArray: assets,
        startDate,
        endDate
      })
      //console.log('Response from server:', response.data.data);
      setData(response.data.data);
      setLoaded(true);
      } catch (e) {
        console.error('Error submitting data to server:', e);
        setShowError(true)
      } finally {
        setSearching(false)
      }
    //console.log('Data inicio:', startDate);
    //console.log('Data fim:', endDate);
  };

useEffect(() => {
    if (loaded && data && data.length > 0) {
      const labels = data[0].data.map(entry => {
        const [ano, mes, dia] = entry.date.split('-')
        return `${dia}/${mes}/${ano}`        
      }); 

      const datasets = data.map((assetData, index) => ({
        label: `${assetData.asset} Preço de Fechamento`, 
        data: assetData.data.map(entry => entry.closeValue), 
        fill: false,
        borderColor: `hsl(${(index * 60) % 360}, 70%, 50%)`, 
      }));

      setChartData({
        labels: labels,
        datasets: datasets
      });
    }
  }, [data, loaded]);

  return ( 
    <>
       <Container className='p-3 shadow-sm' fluid style={{backgroundColor:'#005984'}}>
          <Stack direction="horizontal" className='align-items-center' gap={3}>
              <img 
                src={logo}
                alt=""
                width="48px"
                height="48px"
            />
            <p className='mb-0 h3 text-white tituloSite'>Busca de Ativos B3</p>
          </Stack>
       </Container>
      
      <Container className='mt-4'>
        <Form onSubmit={handleSubmit}>
          <Container>
            <p className='h5 data'>Insira os ativos que deseja buscar</p>
            <TransitionGroup>
              {inputFields.map(field => (
                <CSSTransition
                key={field.id}
                nodeRef={field.ref}
                timeout={300} 
                classNames="item"
                >
                  <Stack className='mb-2' direction="horizontal" gap={1} key={field.id} ref={field.ref}>
                        <Form.Control
                          className='inputField'
                          type="text"
                          value={field.value}
                          onChange={event => handleChange(field.id, event)}
                          placeholder="Pesquisar..."
                          required
                      />
                      <Button className='deleteButton' id={field.id} onClick={() => handleDeleteField(field.id)}>
                        -
                      </Button>
                  </Stack>
                </CSSTransition>

              ))}    
            </TransitionGroup>

            <Button type="button" className="addButton mt-2" onClick={handleAddField}>
              + Adicionar
            </Button>        
          </Container>
          
          <Container className='mt-3 mb-3 border-top'>
            <Container className='mt-3 mb-3'>
              <Form.Group controlId='formDates'>
                  <Stack>
                  <Form.Label className='h5 data'>Data de início da consulta:</Form.Label>
                    <Form.Control
                      className='inputField'  
                      type='date' 
                      value={startDate} 
                      onChange={e => setStartDate(e.target.value)} 
                      required
                    />
                  </Stack>
                  <Stack className='mt-3'>
                    <Form.Label className='h5 data'>Data de fim da consulta:</Form.Label>
                      <Form.Control
                        className='inputField' 
                        type='date' 
                        value={endDate} 
                        onChange={e => setEndDate(e.target.value)} 
                        required
                      />
                  </Stack>
                    <Button type="submit" className="submitButton mt-3">Pesquisar!</Button>
              </Form.Group> 
            </Container>
          </Container>
        </Form>
      </Container>

      <Modal show={show} onHide={() => setShow(false)}>
        <Modal.Header>
          <Modal.Title>Ação inválida!</Modal.Title>
        </Modal.Header>
        <Modal.Body>Você precisa de pelo menos um ativo para realizar a busca.</Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShow(false)}>
            Okay
          </Button>
        </Modal.Footer>      
      </Modal>


      <Modal show={showError} onHide={() => setShowError(false)}>
        <Modal.Header>
          <Modal.Title>Ocorreu um erro.</Modal.Title>
        </Modal.Header>
        <Modal.Body>Revise o que foi escrito e tente novamente</Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={() => setShowError(false)}>
            Okay
          </Button>
        </Modal.Footer>      
      </Modal>
        
        {searching && ( 
          <Container className='d-flex justify-content-center align-items-center p-5'> 
            <Spinner animation="border" variant="primary"/>
          </Container>  
        )}

      
        {loaded && chartData && !searching && (
        <>
        <Container className='border border-secondary-subtle rounded'> 
            <p className='h3 p-2 pt-3'>{data.map(assetData => assetData.asset).join(', ')}</p>
            <Line data={chartData}></Line>
         </Container>
         <br/>
        </>
        )}
       
    </>
  );
}


