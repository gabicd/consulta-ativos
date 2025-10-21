import express from 'express';
import axios from 'axios';
import cors from 'cors';
import 'dotenv/config'

const app = express();  
app.use(express.json());
app.use(cors());

const PORT = 3000
const API_KEY =  process.env.MY_API_KEY
const BASE_URL = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol="

// rota para receber os dados do frontend e buscar na API externa
app.post('/submit', async (req, res) => {
    const { assetArray, startDate, endDate } = req.body;
    const ativos = assetArray.flat();

    //console.log('Received body:', ativos);
    //console.log('Start Date:', startDate);
    //console.log('End Date:', endDate);
    

    try {   // otimização com Promise.all para múltiplas requisições
            const promises = ativos.map(async ativo => {
            const url = `${BASE_URL}${ativo}.SA&apikey=${API_KEY}`; //por padrao, retorna os ultimos 100 data points
            const response = await axios.get(url)
       
            // Filtrar os dados com base nas datas fornecidas
            const rawData = response.data['Time Series (Daily)'];
            const filteredData = [];
            
            for (let date in rawData) {
                if (date >= startDate && date <= endDate) {
                    filteredData.push({ 
                        date: date, 
                        closeValue: rawData[date]['4. close'] 
                    });
                }
            }

            return { asset: ativo, data: filteredData };
        });

        const results = await Promise.all(promises);
        res.json({ data: results });
       console.log('Fetched data:', results);
    } catch (error) {
        console.error('Error fetching data from external API:', error);
        res.status(500).json({ error: 'Failed to fetch data from external API' });
        }
    });  


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})