import React from 'react';
import { useState, useEffect, useRef, createRef } from 'react';
import { Form, Button, Container, Spinner, Stack } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import InfoModal from './components/infoModal.jsx';
import InfoCard from './components/infoCard.jsx';
import zoomPlugin from 'chartjs-plugin-zoom'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import api from './services/api';
import logo from './assets/inoa-logo.png';
import 'bootstrap/dist/css/bootstrap.min.css';
import './asset-search.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

export default function SearchAsset () {
  const [inputFields, setInputFields] = useState([{ id: 1, value: '', ref: createRef(null) }]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState([]);
  const [error, setError] = useState(null)
  const [searching, setSearching] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [modalInfo, setModalInfo] = useState(null)
  const [chartData, setChartData] = useState(null)

  const chartRef = useRef(null)
  const today = new Date()

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
      setModalInfo({
        title: 'Ação inválida!',
        body: 'Você precisa de pelo menos um ativo para realizar a busca',
        variant: 'primary'
      }) 
      return
    } 
    const updatedInputFields = inputFields.filter(field => field.id != id);
    setInputFields(updatedInputFields);
  }

  const handleResetZoom = () => {
    if(chartRef.current) {
      chartRef.current.resetZoom()
    }
  }
  
  const handleSubmit = async (event) => {
    event.preventDefault(); 
    if (new Date(endDate) - new Date (startDate) <= 0 || new Date(endDate) > today){
        setModalInfo({
          title: 'Período inválido',
          body: 'Sua data de início precisa ser anterior à data de fim, e a data de fim não pode ser futura',
        })
        
        return
    }

    const assets = (inputFields.map(field => ((field.value).toUpperCase()).trim())); 
      try {
        setSearching(true)    
        const response = await api.post('/submit', { 
        assetArray: assets,
        startDate,
        endDate
      })
      
      setData(response.data.data);
      setLoaded(true);
      setError(null)
      } catch (e) {
        console.error('Error submitting data to server:', e);
        setError(e)
          setModalInfo({
            title: `Ocorreu um erro: ${e.message}`,
            body: 'Revise o que foi inserido e tente novamente.',
            variant: 'danger'
        }) 
      } finally {
        setSearching(false)
      }
    
  };

useEffect(() => {
    if (loaded && data && data.length > 0) {
      const labels = data[0].data.map(entry => {
        const [ano, mes, dia] = entry.date.split('-')
        return `${dia}/${mes}/${ano}`        
      }); 

      const datasets = data.map((assetData, index) => ({
        label: `${assetData.asset}`, 
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


  const configs = {
    responsive: true,
    plugins: {
      title:{text: 'Preço de Fechamento Diário', display: true},
      zoom: { 
        pan: { 
          enabled: true,
          mode: 'xy', 
          speed: 0.1
        },
        zoom: { 
          wheel: {
            enabled: true,
            speed: 0.1 
          },
          drag: {
            enabled: false,
            maintainAspectRatio: true
          },
          mode: 'xy',

        }
      } 
 
    }
  }

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
            <a className='text-decoration-none mb-0 h3 text-white tituloSite' href="https://www.b3.com.br/pt_br/para-voce">
              Busca de Ativos B3
            </a>
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

      <InfoModal 
        show={modalInfo !== null}
        onHide={() => setModalInfo(null)}
        title={modalInfo?.title}
        body={modalInfo?.body}
        buttonVariant={modalInfo?.variant}
      />

        {searching && ( 
          <Container className='d-flex justify-content-center align-items-center p-5'> 
            <Spinner animation="border" variant="info"/>
          </Container>  
        )}

        {loaded && chartData && !searching && !error &&(
        <>
        <Container className='d-flex flex-column border border-secondary-subtle rounded align-items-center'> 
              <Button className='mt-3 ms-auto deleteButton' onClick={handleResetZoom}>Zoom Inicial</Button>
            <Line 
              data={chartData}
              options={configs}
              ref={chartRef}
            />
         </Container>
            <InfoCard
              data={data}
            />
         <br/>
        </>
        )}
       
    </>
  );
}


