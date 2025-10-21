import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path'
import YahooFinance from "yahoo-finance2";
import 'dotenv/config'
import { autoc } from 'yahoo-finance2/modules';

const app = express();  
app.use(express.json());
app.use(cors());
const dataFilePath = './persistentData.json';
const yahooFinance = new YahooFinance(); //api externa de cotação

const PORT = 3000

const isWeekend = date => date.getUTCDay() % 6 === 0;

// rota para receber os dados do frontend e buscar na API externa
app.post('/submit', async (req, res) => {
    const { assetArray, startDate, endDate } = req.body;
    const ativos = assetArray.flat();
    const endDateObj = new Date(endDate)
    endDateObj.setUTCDate(endDateObj.getUTCDate() + 1) //period2 nao inclui a data final, entao transforma em objeto para adicionar um dia na busca
    
    try {   // otimização com Promise.all para múltiplas requisições
        const saveData = {}
        const searchDates = getIntervalDates(startDate, endDate)
        const promises = ativos.map(async ativo => {
        const missingInfo =  await findMissingDates(searchDates, ativo)
        console.log(missingInfo)
        const symbol = `${ativo}.SA`    //adicionar o .SA para especificar que a busca é de um ativo na bolsa brasileira

            const response = await yahooFinance.chart(symbol, {
                period1: startDate,
                period2: endDateObj
            })
       
            const cotacoes = response.quotes
            //console.log(cotacoes)

            const filteredData = cotacoes.map((cotacao) => ({
            date: cotacao.date.toISOString().split('T')[0], //formato original é um Date object
            closeValue: cotacao.close, 
        }));

        saveData[ativo] = filteredData

        return {
                asset: ativo, 
                data: filteredData,
        } 
    }
);
        const results = await Promise.all(promises);
        //await fs.writeFile('./persistentData.json', JSON.stringify(saveData, null, 2))
        
        res.json({ data: results });
        //console.log('Fetched data:', results);
    } catch (error) {
        console.error('Error fetching data from external API:', error);
        res.status(500).json({ error: 'Failed to fetch data from external API' });
        }
    });  

function getIntervalDates(startDate, endDate) {
    const days = []
    let currentDate = new Date(`${startDate}T00:00:00Z`);
    const finalDate = new Date(`${endDate}T00:00:00Z`);

    while (currentDate <= finalDate) {
        if (!(isWeekend(currentDate))) {
            days.push(currentDate.toISOString().split('T')[0]);
        }
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    return days;

}

async function findMissingDates(searchDates, ativo) {
    try {
        const fileContent = await fs.readFile(dataFilePath, 'utf8')
        const jsonData = JSON.parse(fileContent)

        const assetData = jsonData[ativo] || []

        const existingDates = new Set(assetData.map(record => record.date))

        const missingDates = []

        for (const date of searchDates) {
            if (!(existingDates.has(date))) {
                missingDates.push(date)
            }
        }

        return missingDates
    } catch (error) {
        console.error(error)
    }
}

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})