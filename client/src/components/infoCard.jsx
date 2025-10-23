import { useState } from 'react'
import { Container, Card, Row, Col } from 'react-bootstrap'

function CardImage({mySrc, placeholder}) {
    const [imgSrc, setImgSrc] = useState(mySrc)

    const handleError = () => {
        if(imgSrc !== placeholder) {
            setImgSrc(placeholder)
        }
    }
    
    return (
        <Card.Img
            src={imgSrc}
            onError={handleError}
        />
    )
}

export default function InfoCard ({data = []}) {
    const BASE_IMG_URL = 'https://www.infomoney.com.br/wp-content/uploads/2025/08/img-ticker-'
    const PLACEHOLDER_URL = 'https://placehold.co/400'

    return (
        <Container className='mt-3'>
            <Row className='justify-content-center g-2'>
                {data.map(assetData => (
                    <Col xs={12} md={8} lg={4} xl={2} key={assetData.asset} className="d-flex justify-content-center">
                        <Card className='infoCard'>
                        <Card.Body>
                            <CardImage
                            mySrc={`${BASE_IMG_URL}${(assetData.asset).toLowerCase()}.png`}
                            placeholder={PLACEHOLDER_URL}
                            />
                            <div className='infoWrapper'>
                            <Card.Title className='cardTitle'>{assetData.asset}</Card.Title>
                            <Card.Text className='cardText'>{assetData.nome}</Card.Text>
                            </div>
                        </Card.Body>
                        </Card>
                    </Col>
                ))}

            </Row>
        </Container>
    )
}