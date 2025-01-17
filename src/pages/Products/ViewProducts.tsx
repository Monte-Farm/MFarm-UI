import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import ObjectDetails from "Components/Common/ObjectDetails";
import ProductForm, { ProductData } from "Components/Common/ProductForm";
import { APIClient } from "helpers/api_helper";
import { error } from "node:console";
import { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";


const productAttributes = [
    { key: 'id', label: 'Código' },
    { key: 'name', label: 'Nombre' },
    { key: 'category', label: 'Categoría' },
    { key: 'unit_measurement', label: 'Unidad de Medida' },
    { key: 'description', label: 'Descripción' },
]

const foldersArray = ['Products', 'Images']

const ViewProducts = () => {
    document.title = "Catálogo de Productos"
    const axiosHelper = new APIClient();
    const apiUrl = process.env.REACT_APP_API_URL;

    const [products, setProducts] = useState([])
    const [selectedProduct, setSelectedProduct] = useState<ProductData>()
    const [urlImageProduct, setUrlImageProduct] = useState<string>('')

    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ create: false, details: false, update: false, delete: false });
    const columns = [
        { header: 'Código', accessor: 'id', isFilterable: true },
        { header: 'Nombre', accessor: 'name', isFilterable: true },
        {
            header: 'Categoría', accessor: 'category', isFilterable: true,
            options: [
                { label: 'Alimentos', value: 'Alimentos' },
                { label: 'Medicamentos', value: 'Medicamentos' },
                { label: 'Suministros', value: 'Suministros' },
                { label: 'Equipamiento', value: 'Equipamientos' }
            ]
        },
        { header: 'Descripción', accessor: 'description', isFilterable: true },
        {
            header: 'Unidad de Medida', accessor: 'unit_measurement', isFilterable: true,
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
        {
            header: 'Estado', accessor: 'status', isFilterable: true, render: (value: boolean) => (
                <Badge color={value === true ? "success" : "danger"}>
                    {value === true ? "Activo" : "Inactivo"}
                </Badge>
            ),
        },
        {
            header: "Acciones",
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="btn-secondary btn-icon" onClick={() => handleClicModal('details', row)}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>

                    <Button className="btn-secondary btn-icon" disabled={row.status !== true} onClick={() => handleClicModal('update', row)}>
                        <i className="ri-pencil-fill align-middle"></i>
                    </Button>

                    <Button className="btn-danger btn-icon" disabled={row.status !== true} onClick={() => handleClicModal('delete', row)}>
                        <i className="ri-delete-bin-fill align-middle"></i>
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

    const showAlert = (color: string, message: string) => {
        setAlertConfig({ visible: true, color: color, message: message })
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    }

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleClicModal = async (modal: any, data: ProductData) => {
        setSelectedProduct(data);
        toggleModal(modal)

        if (modal === 'details' || modal === 'update') {
            if (data.image) {
                await fetchImageById(data.image)
            }
        }
    }

    const handleFetchProducts = async () => {
        await axiosHelper.get(`${apiUrl}/product`)
            .then((response) => {
                setProducts(response.data.data)
            })
            .catch((error) => {
                handleError(error, 'Ha ocurrido un error al recuperar los productos, intentelo más tarde')
            })
    }

    const handleCreateProduct = async (data: ProductData) => {
        await axiosHelper.create(`${apiUrl}/product/create_product`, data)
            .then(() => {
                showAlert('success', 'Producto creado con éxito')
                handleFetchProducts()
            })
            .catch((error) => {
                handleError(error, 'Ha ocurrido un error al crear el producto, intentelo más tarde')
            })
            .finally(() => {
                toggleModal('create')
            })
    }

    const handleUpdateProduct = async (data: ProductData) => {
        await axiosHelper.put(`${apiUrl}/product/update_product/${data.id}`, data)
            .then(() => {
                showAlert('success', 'Producto actualizado con éxito')
                handleFetchProducts()
            })
            .catch((error) => {
                handleError(error, 'Ha ocurrido un error al actualizar el producto, intentelo más tarde')
            })
            .finally(() => {
                toggleModal('update')
                setSelectedProduct(undefined)
            })
    }

    const handleDeleteProduct = async (product_id: string) => {
        await axiosHelper.delete(`${apiUrl}/product/delete_product/${product_id}`)
            .then(() => {
                showAlert('success', 'Producto desactivado con éxito')
                handleFetchProducts()
            })
            .catch((error) => {
                handleError(error, 'Ha ocurrido un error al desactivar el producto, intentelo más tarde')
            })
            .finally(() => {
                toggleModal('delete')
                setSelectedProduct(undefined)
            })
    }

    const fetchImageById = async (imageId: string) => {
        try {
            const response = await axiosHelper.get(`${apiUrl}/google_drive/download_file/${imageId}`, { responseType: 'blob' });

            const imageUrl = URL.createObjectURL(response.data);
            setUrlImageProduct(imageUrl);
        } catch (error) {
            console.error('Error al recuperar la imagen: ', error);
        }
    }

    useEffect(() => {
        handleFetchProducts();
    }, [])

    useEffect(() => {
        if (urlImageProduct) {
            URL.revokeObjectURL(urlImageProduct);
        }
    }, [selectedProduct]);


    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Catálogo de Productos"} pageTitle={"Almacén General"}></BreadCrumb>

                <Card style={{ height: '75vh' }}>
                    <CardHeader>
                        <div className="d-flex">
                            <Button color="success" className="ms-auto" onClick={() => toggleModal('create')}>
                                <i className="ri-add-line me-2  " />
                                Agregar Producto
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <CustomTable columns={columns} data={products}></CustomTable>
                    </CardBody>
                </Card>
            </Container>

            {/* Modal Details */}
            <Modal size="lg" isOpen={modals.details} toggle={() => toggleModal("details")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("details")}><h4>Detalles de Producto</h4></ModalHeader>
                <ModalBody>
                    {selectedProduct && (
                        <ObjectDetails attributes={productAttributes} object={selectedProduct} showImage={true} imageSrc={urlImageProduct}></ObjectDetails>
                    )}
                </ModalBody>
            </Modal>

            {/* Modal Create */}
            <Modal size="lg" isOpen={modals.create} toggle={() => toggleModal("create")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("create")}>Nuevo Producto </ModalHeader>
                <ModalBody>
                    <ProductForm onSubmit={handleCreateProduct} onCancel={() => toggleModal("create", false)} foldersArray={foldersArray} />
                </ModalBody>
            </Modal>

            {/* Modal Update */}
            <Modal size="lg" isOpen={modals.update} toggle={() => toggleModal("update")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("update")}>Actualizar Producto</ModalHeader>
                <ModalBody>
                    <ProductForm initialData={selectedProduct} onSubmit={handleUpdateProduct} onCancel={() => toggleModal("update", false)} isCodeDisabled={true} foldersArray={foldersArray} />
                </ModalBody>
            </Modal>

            {/* Modal Delete */}
            <Modal isOpen={modals.delete} toggle={() => toggleModal("delete")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("delete")}>Desactivar Producto</ModalHeader>
                <ModalBody>¿Desea desactivar el producto {selectedProduct?.name}?</ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={() => toggleModal("delete", false)}>Cancelar</Button>
                    <Button color="success" onClick={() => {
                        if (selectedProduct) {
                            handleDeleteProduct(selectedProduct.id)
                        }
                    }}>Confirmar</Button>
                </ModalFooter>
            </Modal>

            {alertConfig.visible && (
                <Alert color={alertConfig.color} className="position-fixed bottom-0 start-50 translate-middle-x p-3">
                    {alertConfig.message}
                </Alert>
            )}
        </div>
    )
}

export default ViewProducts;