import React, { useEffect, useState } from "react";
import { Button, Col, Row, Modal, ModalHeader, ModalBody, ModalFooter, Label, Input, FormFeedback, Alert } from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import CustomTable from "./CustomTable";
import { APIClient } from "helpers/api_helper";
import SupplierForm from "./SupplierForm";
import ProductForm, { ProductData } from "./ProductForm";
import Flatpickr from 'react-flatpickr';
import SelectTable from "./SelectTable";
import { useNavigate } from "react-router-dom";
import FileUploader from "./FileUploader";

const axiosHelper = new APIClient();
const apiUrl = process.env.REACT_APP_API_URL;

interface IncomeFormProps {
    initialData?: IncomeData;
    onSubmit: (data: IncomeData) => Promise<void>;
    onCancel: () => void;
}

interface Product {
    id: string;
    quantity: number;
    price: number;
}

interface Origin {
    originType: string,
    id: string
}

export interface IncomeData {
    id: string;
    warehouse: string;
    date: string; // ISO string
    products: Array<Product>;
    totalPrice: number;
    incomeType: string;
    origin: Origin;
    documents: Array<string>;
    status: boolean;
}

export interface SupplierData {
    id: string;
    name: string;
    address: string;
    phone_number: string;
    email: string;
    supplier_type: string;
    status: boolean;
    rnc: string;
}

const incomeTypeOptions = [
    { label: "Compra", value: "purchase" },
];


const validationSchema = Yup.object({
    id: Yup.string()
        .required("Por favor, ingrese el ID")
        .test('unique_id', "Este identificador ya existe, por favor ingrese otro", async (value) => {
            if (!value) return false;
            try {
                const result = await axiosHelper.get(`${apiUrl}/incomes/income_id_exists/${value}`);
                return !result.data.data;
            } catch (error) {
                console.error(`Error al validar el ID: ${error}`);
                return false;
            }
        }),
    date: Yup.string().required("Por favor, ingrese la fecha"),
    totalPrice: Yup.number().min(0, "El precio total debe ser positivo").required("Por favor, ingrese el precio total"),
    incomeType: Yup.string().required("Por favor, seleccione el tipo de ingreso"),
    origin: Yup.object({
        id: Yup.string().required("Por favor, seleccione un proveedor"),
    }),
    documents: Yup.array().of(Yup.string()).required("Por favor, agregue al menos un documento"),
});


const IncomeForm: React.FC<IncomeFormProps> = ({ initialData, onSubmit, onCancel }) => {
    const axiosHelper = new APIClient()
    const apiUrl = process.env.REACT_APP_API_URL
    const history = useNavigate()

    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<SupplierData | null>(null);
    const [modals, setModals] = useState({ createSupplier: false, createProduct: false });
    const [products, setProducts] = useState([])
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const fetchSuppliers = async () => {
        try {
            const response = await axiosHelper.get(`${apiUrl}/supplier/find_supplier_status/${true}`);
            setSuppliers(response.data.data);
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener a los proveedores, intentelo más tarde')
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await axiosHelper.get(`${apiUrl}/product`)
            setProducts(response.data.data)
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener los productos, intentelo más tarde')
        }
    }


    const formik = useFormik({
        initialValues: initialData || {
            id: "",
            warehouse: 'AG001',
            date: "",
            products: [],
            totalPrice: 0,
            incomeType: "",
            origin: {
                originType: 'supplier',
                id: ""
            },
            documents: [],
            status: true,
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            try {
                setSubmitting(true);
                await onSubmit(values);
            } catch (error) {
                console.error("Error al enviar el formulario:", error);
            } finally {
                setSubmitting(false);
            }
        },
    });

    const handleSupplierChange = (supplierId: string) => {
        const supplier = suppliers.find((s) => s.id === supplierId) || null;
        setSelectedSupplier(supplier);
        formik.setFieldValue("origin.id", supplierId);
    };

    const handleCreateSupplier = async (supplierData: SupplierData) => {
        try {
            const response = await axiosHelper.create(`${apiUrl}/supplier/create_supplier`, supplierData);
            const newSupplier = response.data.data;

            await fetchSuppliers();
            setSelectedSupplier(newSupplier);
            formik.setFieldValue("origin.id", newSupplier.id);

            toggleModal("createSupplier");
            setAlertConfig({ visible: true, color: 'success', message: 'Proveedor creado con éxito' })
            setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
        } catch (error) {
            toggleModal('createSupplier')
            handleError(error, 'Ha ocurrido un error al crear al proveedor, intentelo más tarde')
        }
    };

    const handleCreateProduct = async (productData: ProductData) => {
        try {
            const response = await axiosHelper.create(`${apiUrl}/product/create_product`, productData)

            await fetchProducts();
            toggleModal('createProduct')
            setAlertConfig({ visible: true, color: 'success', message: 'Producto creado con éxito' })
            setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000)
        } catch (error) {
            toggleModal('createProduct')
            handleError(error, 'Ha ocurrido un error al crear el producto, intentelo más tarde')
        }
    }

    const handleFileUpload = (file: File) => {
        console.log('Archivo cargado:', file.name);
    }

    const handleProductSelect = (selectedProducts: Array<{ id: string; quantity: number; price: number }>) => {
        formik.setFieldValue("products", selectedProducts);
    };

    useEffect(() => {
        fetchProducts();
        fetchSuppliers();
    }, [])

    useEffect(() => {
        const supplier = suppliers.find((s) => s.id === formik.values.origin.id) || null;
        setSelectedSupplier(supplier);
        console.log(formik.values)
    }, [formik.values.origin.id, suppliers]);

    useEffect(() => {
        const subtotal = formik.values.products.reduce(
            (sum, product) => sum + (product.quantity * product.price || 0),
            0
        );
        const totalWithTax = subtotal * 1.18;
        formik.setFieldValue("totalPrice", parseFloat(totalWithTax.toFixed(2)));
    }, [formik.values.products]);



    return (
        <>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    formik.handleSubmit();
                }}
            >
                <Row>
                    <Col lg={4}>
                        <div className="">
                            <Label htmlFor="idInput" className="form-label">Identificador</Label>
                            <Input
                                type="text"
                                id="idInput"
                                name="id"
                                value={formik.values.id}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.id && !!formik.errors.id}
                            />
                            {formik.touched.id && formik.errors.id && <FormFeedback>{formik.errors.id}</FormFeedback>}
                        </div>
                    </Col>

                    {/* Fecha */}
                    <Col lg={8}>
                        <div className="">
                            <Label htmlFor="dateInput" className="form-label">Fecha</Label>

                            <Flatpickr
                                id="dateInput"
                                className="form-control"
                                value={formik.values.date}
                                options={{
                                    dateFormat: "d-m-Y",
                                    defaultDate: formik.values.date,
                                }}
                                onChange={(date) => {
                                    const formattedDate = date[0].toLocaleDateString("es-ES");
                                    formik.setFieldValue("date", formattedDate);
                                }}
                            />
                            {formik.touched.date && formik.errors.date && <FormFeedback className="d-block">{formik.errors.date}</FormFeedback>}

                        </div>
                    </Col>
                </Row>

                {/* Agregar campo de compra de contado o a meses cuando el tipo de ingreso sea compra */}

                {/* Tipo de Ingreso */}
                <div className="mt-4">
                    <Label htmlFor="incomeTypeInput" className="form-label">Tipo de Ingreso</Label>
                    <Input
                        type="select"
                        id="incomeTypeInput"
                        name="incomeType"
                        value={formik.values.incomeType}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.incomeType && !!formik.errors.incomeType}
                    >
                        <option value="">Seleccione un tipo</option>
                        {incomeTypeOptions.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </Input>
                    {formik.touched.incomeType && formik.errors.incomeType && <FormFeedback>{formik.errors.incomeType}</FormFeedback>}
                </div>

                {/* Datos del proveedor */}
                <div className="d-flex mt-4">
                    <h5 className="me-auto">Datos del Proveedor</h5>
                    <Button color="secondary" className="h-50 mb-2" onClick={() => toggleModal('createSupplier')}>
                        <i className="ri-add-line me-2"></i>
                        Nuevo Proveedor
                    </Button>
                </div>

                <div className="border"></div>

                {/* Proveedor */}
                <div className="mt-3">
                    <Label htmlFor="supplierInput" className="form-label">Proveedor</Label>
                    <Input
                        type="select"
                        id="supplierInput"
                        name="origin.id"
                        value={formik.values.origin.id} // Valor controlado por formik
                        onChange={(e) => handleSupplierChange(e.target.value)} // Sincroniza el cambio
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.origin?.id && !!formik.errors.origin?.id}
                    >
                        <option value=''>Seleccione un proveedor</option>
                        {suppliers.map((supplier) => (
                            <option key={supplier.id} value={supplier.id}>
                                {supplier.name}
                            </option>
                        ))}
                    </Input>

                    {formik.touched.origin?.id && formik.errors.origin?.id && <FormFeedback>{formik.errors.origin?.id}</FormFeedback>}
                </div>

                <Row className="mt-4">
                    <Col lg={6}>
                        <Label htmlFor="supplierAddress" className="form-label">Dirección</Label>
                        <Input type="text" className="form-control" id="supplierAddress" value={selectedSupplier?.address} disabled></Input>
                    </Col>

                    <Col lg={6}>
                        <Label htmlFor="supplierEmail" className="form-label">Correo Electrónico</Label>
                        <Input type="text" className="form-control" id="supplierEmail" value={selectedSupplier?.email} disabled></Input>
                    </Col>
                </Row>

                <Row className="mt-4">
                    <Col lg={4}>
                        <Label htmlFor="supplierRNC" className="form-label">RNC</Label>
                        <Input type="text" className="form-control" id="supplierRNC" value={selectedSupplier?.rnc} disabled></Input>
                    </Col>
                    <Col lg={4}>
                        <Label htmlFor="supplierPhoneNumber" className="form-label">Número Telefonico</Label>
                        <Input type="text" className="form-control" id="supplierPhoneNumber" value={selectedSupplier?.phone_number} disabled></Input>
                    </Col>
                    <Col lg={4}>
                        <Label htmlFor="supplierType" className="form-label">Tipo de Proveedor</Label>
                        <Input type="text" className="form-control" id="supplierType" value={selectedSupplier?.supplier_type} disabled></Input>
                    </Col>
                </Row>

                {/* Productos */}
                <div className="d-flex mt-5">
                    <h5 className="me-auto">Productos</h5>
                    <Button color="secondary" className="h-50 mb-2" onClick={() => { toggleModal('createProduct') }}>
                        <i className="ri-add-line me-2"></i>
                        Nuevo Producto
                    </Button>
                </div>
                <div className="border"></div>

                {/* Tabla de productos */}
                <div className="mt-3 border border-0">
                    <SelectTable data={products} onProductSelect={handleProductSelect}></SelectTable>
                </div>

                {/* Precio Total  */}
                <div className="mt-4">
                    <Label htmlFor="totalPriceInput" className="form-label">Precio Total</Label>
                    <div className="form-icon">
                        <Input
                            className="form-control form-control-icon"
                            type="number"
                            id="totalPriceInput"
                            name="totalPrice"
                            value={formik.values.totalPrice}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.totalPrice && !!formik.errors.totalPrice}
                            disabled={true}
                        />
                        <i>$</i>
                    </div>
                    {formik.touched.totalPrice && formik.errors.totalPrice && <FormFeedback>{formik.errors.totalPrice}</FormFeedback>}
                </div>

                <Label className="mt-1">ITBIS: 18%</Label>


                {/* Documentos */}
                <div className="mt-4">
                    <Label htmlFor="documentsInput" className="form-label">Documentos</Label>
                    <FileUploader
                        acceptedFileTypes={['image/*', 'application/pdf']} // Imágenes y PDFs
                        onFileUpload={handleFileUpload}
                    />

                </div>

                {/* Botones */}
                <div className="d-flex justify-content-end mt-4 gap-2">
                    <Button color="danger" onClick={() => setCancelModalOpen(true)} disabled={formik.isSubmitting}>
                        Cancelar
                    </Button>
                    <Button color="success" type="submit" disabled={formik.isSubmitting}>
                        {formik.isSubmitting ? "Guardando..." : initialData ? "Actualizar Transacción" : "Registrar Transacción"}
                    </Button>
                </div>
            </form>

            {/* Modal de Confirmación */}
            <Modal isOpen={cancelModalOpen} centered toggle={() => setCancelModalOpen(!cancelModalOpen)}>
                <ModalHeader>Confirmación</ModalHeader>
                <ModalBody>¿Estás seguro de que deseas cancelar? Los datos no se guardarán.</ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={onCancel}>Sí, cancelar</Button>
                    <Button color="success" onClick={() => setCancelModalOpen(false)}>No, continuar</Button>
                </ModalFooter>
            </Modal>

            <Modal size="lg" isOpen={modals.createSupplier} toggle={() => toggleModal("createSupplier")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("createSupplier")}>Nuevo Proveedor</ModalHeader>
                <ModalBody>
                    <SupplierForm onSubmit={handleCreateSupplier} onCancel={() => toggleModal("createSupplier", false)} />
                </ModalBody>
            </Modal>

            <Modal size="lg" isOpen={modals.createProduct} toggle={() => toggleModal("createProduct")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("createProduct")}>Nuevo Producto</ModalHeader>
                <ModalBody>
                    <ProductForm onCancel={() => toggleModal("createProduct", false)} onSubmit={handleCreateProduct} />
                </ModalBody>
            </Modal>

            {/* Alerta */}
            {alertConfig.visible && (
                <Alert color={alertConfig.color} className="position-fixed bottom-0 start-50 translate-middle-x p-3">
                    {alertConfig.message}
                </Alert>
            )}
        </>
    );
};

export default IncomeForm;
