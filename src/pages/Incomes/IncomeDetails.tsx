import BreadCrumb from "Components/Common/BreadCrumb"
import CustomTable from "Components/Common/CustomTable"
import { IncomeData } from "Components/Common/IncomeForm"
import ObjectDetails from "Components/Common/ObjectDetails"
import { APIClient } from "helpers/api_helper"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Alert, Button, Card, CardBody, CardHeader, Col, Container, Row } from "reactstrap"

const incomeAttributes = [
    { key: 'id', label: 'Identificador' },
    { key: 'warehouse', label: 'Almacén' },
    { key: 'date', label: 'Fecha' },
    { key: 'origin.id', label: '' },
    { key: 'totalPrice', label: 'Precio Total' },
    { key: 'incomeType', label: 'Tipo de alta' }
]



const IncomeDetails = () => {
    document.title = 'Detalles de entrada'
    const axiosHelper = new APIClient();
    const history = useNavigate();
    const apiUrl = process.env.REACT_APP_API_URL;
    const { id_income } = useParams();

    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ update: false, delete: false });
    const [incomeDetails, setIncomeDetails] = useState<IncomeData>()
    const [incomeDisplay, setIncomeDisplay] = useState({})
    const [productsIncome, setProductsIncome] = useState([])

    const productColumns = [
        { header: 'Código', accessor: 'id', isFilterable: true },
        { header: 'Producto', accessor: 'name', isFilterable: true },
        { header: 'Cantidad', accessor: 'quantity', isFilterable: true },
        { header: 'Unidad de Medida', accessor: 'unit_measurement', isFilterable: true,
            options: [
                { label: "Galones", value: 'Galones' },
                { label: "Litros", value: 'Litros' },
                { label: "Frascos", value: 'Frascos' },
                { label: "Piezas", value: 'Piezas' },
                { label: "Kilos", value: 'Kilos' },
                { label: "Dosis", value: 'Dosis' },
                { label: "Paquetes", value: 'Paquetes' },
                { label: "Cajas", value: 'Cajas' },
                { label: "Metros", value: 'Metros' },
              ]
         },
        { header: 'Precio Unitario', accessor: 'price' },
        { header: 'Categoría', accessor: 'category', isFilterable: true,
            options: [
                { label: 'Alimentos', value: 'Alimentos' },
                { label: 'Medicamentos', value: 'Medicamentos' },
                { label: 'Suministros', value: 'Suministros' },
                { label: 'Equipamiento', value: 'Equipamientos' }
              ]
         },
        { header: 'Descripción', accessor: 'description', isFilterable: true },
        {
            header: "Acciones",
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="btn-secondary btn-icon" onClick={() => handleClicProductDetails(row)}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                </div>
            ),
        },
    ]

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleFetchIncome = async () => {
        await axiosHelper.get(`${apiUrl}/incomes/find_incomes_id/${id_income}`)
            .then((response) => {
                const incomeFound = response.data.data;
                setIncomeDetails(incomeFound)
            })
            .catch((error) => {
                handleError(error, 'El servicio no esta disponible, intentelo más tarde')
            })
    }

    const handleFetchIncomeDisplay = async() => {
        await axiosHelper.get(`${apiUrl}/incomes/income_display_details/${id_income}`)
        .then((response) => {
            const incomeFound = response.data.data
            console.log(incomeFound)

            if (incomeFound.origin.originType === 'supplier') {
                incomeAttributes[3].label = 'Proveedor'
            } else {
                incomeAttributes[3].label = 'Almacén de origen'
            }

            setIncomeDisplay(incomeFound)
        })
        .catch((error) => {
            handleError(error, 'Ha ocurrido un error al obtener los datos de la entrada, intentelo más tarde');
        })
    }

    const handleFetchIncomeProducts = async () => {
        if (incomeDetails) {
            await axiosHelper.create(`${apiUrl}/product/find_products_by_array`, incomeDetails?.products)
                .then((response) => {
                    setProductsIncome(response.data.data)
                })
                .catch((error) => {
                    handleError(error, 'El servicio no esta disponible, intentelo más tarde');
                })
        }
    }

    const handleClicProductDetails = (row: any) => {
        history(`/warehouse/inventory/product_details?warehouse=${incomeDetails?.warehouse}&product=${row.id}`)
    }

    const handleBack = () => {
        if (window.history.length > 1) {
            history(-1)
        } else {
            history('/#')
        }
    }

    useEffect(() => {
        handleFetchIncome();
        handleFetchIncomeDisplay();
    }, [])

    useEffect(() => {
        handleFetchIncomeProducts();
    }, [incomeDetails])



    return (
        <div className="page-content min-vh-100">
            <Container fluid>
                <BreadCrumb title={"Detalles de entrada"} pageTitle={"Entradas"} />

                <div className="d-flex gap-2 mb-3 mt-3">
                    <Button className="me-auto" color="secondary" onClick={handleBack}>
                        <i className="ri-arrow-left-line me-3"></i>Regresar
                    </Button>
                </div>

                <Row className="d-flex" style={{ alignItems: 'stretch', height: '60vh   ' }}>
                    <Col lg={4} className="d-flex">
                        <Card className="w-100 h-100">
                            <CardHeader>
                                <h4>Detalles</h4>
                            </CardHeader>
                            <CardBody>
                                {incomeDetails && (
                                    <ObjectDetails attributes={incomeAttributes} object={incomeDisplay}></ObjectDetails>
                                )}
                            </CardBody>
                        </Card>
                    </Col>

                    <Col lg={8} className="d-flex">
                        <Card className="w-100 h-100">
                            <CardHeader>
                                <h4>Productos</h4>
                            </CardHeader>
                            <CardBody>
                                <CustomTable columns={productColumns} data={productsIncome} rowClickable={false} defaultFilterField='name'/>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/* Tarjeta de abajo se empuja hacia abajo */}
                <Card className="mt-4">
                    <CardHeader className="d-flex">
                        <h4>Archivos Adjuntos</h4>
                        <Button className="ms-auto">
                            <i className="ri-download-line me-2"></i>
                            Descargar Archivos
                        </Button>
                    </CardHeader>
                    <CardBody>
                        No hay archivos adjuntos
                    </CardBody>
                </Card>

                {alertConfig.visible && (
                    <Alert color={alertConfig.color} className="position-fixed bottom-0 start-50 translate-middle-x p-3">
                        {alertConfig.message}
                    </Alert>
                )}
            </Container>
        </div>
    )

}

export default IncomeDetails