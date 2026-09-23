import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';

export const CreateEventView = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: '',
    cliente: '',
    fecha: '',
    lugar: ''
  });

  const [errors, setErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let newErrors = {};

    if (!formData.nombre.trim()) newErrors.nombre = "El nombre del evento es obligatorio.";
    if (!formData.tipo) newErrors.tipo = "Debes seleccionar el tipo de evento.";
    if (!formData.cliente.trim()) newErrors.cliente = "El cliente/contacto es obligatorio.";
    if (!formData.fecha) {
      newErrors.fecha = "La fecha es obligatoria.";
    } else {
      const today = new Date().toISOString().split('T')[0];
      if (formData.fecha < today) {
        newErrors.fecha = "La fecha no puede ser anterior a hoy.";
      }
    }
    if (!formData.lugar.trim()) newErrors.lugar = "El lugar es obligatorio.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSuccess(true);
    setTimeout(() => {
      navigate('/hoy');
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-lg text-center shadow-sm">
        <h3 className="text-xl font-bold mb-2">¡Evento creado exitosamente!</h3>
        <p className="text-sm">Redirigiendo a las gestiones de hoy...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Crear Nuevo Evento</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre del evento *</label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ej. Boda de Carlos y Ana"
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.nombre && <p className="mt-1 text-sm text-red-600 font-medium">{errors.nombre}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tipo de evento *</label>
          <select
            name="tipo"
            value={formData.tipo}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Seleccionar...</option>
            <option value="boda">Boda</option>
            <option value="social">Social</option>
            <option value="corporativo">Corporativo</option>
            <option value="cumpleaños">Cumpleaños</option>
            <option value="otro">Otro</option>
          </select>
          {errors.tipo && <p className="mt-1 text-sm text-red-600 font-medium">{errors.tipo}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Cliente / Contacto *</label>
          <input
            type="text"
            name="cliente"
            value={formData.cliente}
            onChange={handleChange}
            placeholder="Nombre de la persona o empresa"
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.cliente && <p className="mt-1 text-sm text-red-600 font-medium">{errors.cliente}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha del evento *</label>
            <input
              type="date"
              name="fecha"
              value={formData.fecha}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.fecha && <p className="mt-1 text-sm text-red-600 font-medium">{errors.fecha}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Lugar *</label>
            <input
              type="text"
              name="lugar"
              value={formData.lugar}
              onChange={handleChange}
              placeholder="Ej. Salón Campestre"
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.lugar && <p className="mt-1 text-sm text-red-600 font-medium">{errors.lugar}</p>}
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
          <Button variant="neutral" type="button" onClick={() => navigate('/hoy')}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit">
            Guardar Evento
          </Button>
        </div>
      </form>
    </div>
  );
};