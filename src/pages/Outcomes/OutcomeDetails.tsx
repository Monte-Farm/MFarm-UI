import BreadCrumb from "Components/Common/BreadCrumb"
import CustomTable from "Components/Common/CustomTable"
import ObjectDetails from "Components/Common/ObjectDetails"
import { OutcomeData } from "Components/Common/OutcomeForm"
import { APIClient } from "helpers/api_helper"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Alert, Button, Card, CardBody, CardHeader, Col, Container, Row } from "reactstrap"

const outcomeAttributes = [
    { key: 'id', label: 'Identificador' },
    { key: 'date', label: 'Fecha' },
    { key: 'warehouseOrigin', label: 'Almacén de salida' },
    { key: 'outcomeType', label: 'Motivo de salida' },
]

const warehouseDestinyAttributes = [
    { key: 'id', label: 'Identificador' },
    { key: 'name', label: 'Nombre' },
    { key: 'manager', label: 'Responsable' },
    { key: 'location', label: 'Ubicación' },
]

const OutcomeDetails = () => {
    document.title = 'Detalles de salida'
    const apiUrl = process.env.REACT_APP_API_URL;
    const axiosHelper = new APIClient();
    const history = useNavigate();
    const { id_outcome } = useParams();

    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })
    const [outcome, setOutcome] = useState<OutcomeData>( );
    const [warehouseDestiny, setWarehouseDestiny] = useState({})
    const [productsOutcome, setProductsOutcome] = useState([])

    const productColumns = [
        { header: 'Código', accessor: 'id' },
        { header: 'Producto', accessor: 'name' },
        { header: 'Cantidad', accessor: 'quantity' },
        { header: 'Unidad de Medida', accessor: 'unit_measurement' },
        { header: 'Precio Promedio (Unidad)', accessor: 'price' },
        { header: 'Categoría', accessor: 'category' },
        { header: 'Descripción', accessor: 'description' },
    ]


    const handleError = (error: any, message: string) => {
        console.error(message, error)
        setAlertConfig({ visible: true, color: 'danger', message: message })
        setTimeout(() => {
            setAlertConfig({ ...alertConfig, visible: false })
        }, 5000);
    }

    const handleFetchOutcome = async () => {
        await axiosHelper.get(`${apiUrl}/outcomes/find_outcome_id/${id_outcome}`)
            .then((response) => {
                setOutcome(response.data.data)
                console.log(response.data.data)
            })
            .catch((error) => {
                handleError(error, 'Ha ocurrido un error al obtener los datos, intentelo más tarde')
            })
    }

    const handleFetchWarehouseDestiny = async () => {
        await axiosHelper.get(`${apiUrl}/warehouse/find_id/${outcome?.warehouseDestiny}`)
            .then((response) => {
                setWarehouseDestiny(response.data.data)
            })
            .catch((error) => {
                handleError(error, 'Ha ocurrido un error al obtener los datos del almacén de destino, intentelo más tarde')
            })
    }

    const handleFetchOutcomeProducts = async () => {
        await axiosHelper.create(`${apiUrl}/product/find_products_by_array`, outcome?.products)
            .then((response) => {
                setProductsOutcome(response.data.data);
            })
            .catch((error) => {
                handleError(error, 'Ha ocurrido un error la obtener los datos de los productos, intentelo más tarde');
            })
    }

    const handleClicProductDetails = (row: any) => {
        history(`/warehouse/inventory/product_details?warehouse=${outcome?.warehouseDestiny}&product=${row.id}`)
    }

    const handleBack = () => {
        if (window.history.length > 1) {
            history(-1)
        } else {
            history('/warehouse/outcomes/view_outcomes')
        }
    }

    useEffect(() => {
        handleFetchOutcome();
    }, [])

    useEffect(() => {
        if (outcome) {
            handleFetchWarehouseDestiny();
            handleFetchOutcomeProducts();
        }
    }, [outcome])

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Detalles de Salida"} pageTitle={"Salidas"} />

                <div className="d-flex mt-1">
                    <Button className="me-auto" color="secondary" onClick={handleBack}>
                        <i className="ri-arrow-left-line me-3" />
                        Regresar
                    </Button>
                </div>

                <Row className="d-flex mt-3" style={{ alignItems: 'stretch', height: '75vh' }}>
                    <Col lg={4}>
                        <div className="d-flex flex-column gap-3 h-100">
                            <Card className="m-0 h-50">
                                <CardHeader>
                                    <h4>Detalles de Salida</h4>
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails attributes={outcomeAttributes} object={outcome || {}} />
                                </CardBody>
                            </Card>

                            <Card className="m-0 h-50">
                                <CardHeader>
                                    <h4>Almacén de destino</h4>
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails attributes={warehouseDestinyAttributes} object={warehouseDestiny} />
                                </CardBody>
                            </Card>
                        </div>

                    </Col>

                    <Col lg={8}>
                        <Card className="h-100">
                            <CardHeader>
                                <h4>Productos</h4>
                            </CardHeader>
                            <CardBody>
                                <CustomTable columns={productColumns} data={productsOutcome} />
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {alertConfig.visible && (
                    <Alert color={alertConfig.color} className="position-fixed bottom-0 start-50 translate-middle-x p-3">
                        {alertConfig.message}
                    </Alert>
                )}
            </Container>
        </div>
    )
}

export default OutcomeDetails