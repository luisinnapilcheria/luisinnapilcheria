import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Terminos() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Términos y Condiciones - Luisinna Pilcheria";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto bg-white p-6 sm:p-10 rounded-xs border border-rose-200 shadow-2xs space-y-6">
        
        {/* ENCABEZADO */}
        <div className="border-b border-rose-100 pb-4 text-center sm:text-left">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-rose-800 hover:text-stone-900 font-semibold uppercase tracking-wider mb-2 inline-block transition"
          >
            ← Volver al inicio
          </button>
          <h1 className="text-2xl sm:text-3xl font-light text-stone-900 uppercase tracking-wide">
            Términos y Condiciones de Uso
          </h1>
          <p className="text-xs text-stone-400 mt-1 uppercase tracking-widest">
            Última actualización: Agosto 2026
          </p>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="space-y-6 text-xs text-stone-600 leading-relaxed font-light">
          
          <section>
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-2">
              1. Aspectos Generales
            </h2>
            <p>
              El presente sitio web es operado por <strong>Luisinna Pilcheria</strong>. Al navegar, acceder o realizar compras a través de este sitio, el usuario acepta cumplir con los términos y condiciones detallados a continuación. Si no está de acuerdo con alguno de los términos, le solicitamos abstenerse de utilizar la plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-2">
              2. Productos y Disponibilidad
            </h2>
            <p>
              Todas las prendas y productos mostrados en nuestro catálogo están sujetos a disponibilidad de stock. Intentamos reflejar con la mayor exactitud posible los colores, detalles y características de las prendas. No obstante, las imágenes son ilustrativas y los tonos pueden variar según la pantalla o dispositivo del usuario.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-2">
              3. Precios y Modos de Pago
            </h2>
            <p>
              Los precios expresados en el sitio web corresponden a pesos argentinos (ARS) e incluyen los impuestos aplicables, salvo que se indique lo contrario. Nos reservamos el derecho de modificar precios, ofertas y promociones sin previo aviso. Los descuentos por transferencias u otros medios de pago se aplicarán según las condiciones vigentes al momento de finalizar la compra.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-2">
              4. Políticas de Envío y Entregas
            </h2>
            <p>
              Realizamos envíos a todo el territorio nacional a través de empresas de transporte de logística tercerizadas. Los plazos y costos de entrega se calculan en función de la ubicación ingresada por el comprador. Luisinna Pilcheria no se responsabiliza por demoras imputables de forma exclusiva a las empresas de correo o transporte.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-2">
              5. Cambios y Devoluciones (Arrepentimiento)
            </h2>
            <p>
              Conforme a la Ley N° 24.240 de Defensa del Consumidor de la República Argentina, el comprador dispone de un plazo de 10 (diez) días corridos desde la recepción del producto para solicitar la revocación de la compra (botón o solicitud de arrepentimiento). Para efectuar un cambio o devolución, la prenda debe encontrarse sin uso, en perfectas condiciones y con sus etiquetas correspondientes.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-2">
              6. Protección de Datos Personales y Cookies
            </h2>
            <p>
              Los datos recolectados a través de formularios o transacciones son tratados con estricta confidencialidad de acuerdo con la Ley N° 25.326 de Protección de Datos Personales. Asimismo, este sitio utiliza cookies propias y de terceros (incluyendo servicios como Google Analytics y Google Ads) con el fin de optimizar la experiencia de navegación y ofrecer anuncios personalizados.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-2">
              7. Propiedad Intelectual
            </h2>
            <p>
              Todos los contenidos presentes en esta plataforma (logotipos, imágenes, textos, marcas y código fuente) son propiedad exclusiva de Luisinna Pilcheria o cuentan con autorización para su uso. Queda prohibida la reproducción, distribución o modificación sin autorización previa y por escrito.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-2">
              8. Contacto
            </h2>
            <p>
              Ante cualquier duda, consulta o reclamo relativo a estos Términos y Condiciones, podés comunicarte con nosotros a través de:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 font-normal text-stone-700">
              <li>Correo electrónico: <strong>luisinnapilcheria@gmail.com</strong></li>
              <li>WhatsApp: <strong>+54 9 3482 20-2857</strong></li>
            </ul>
          </section>

        </div>

        {/* PIE DE PÁGINA INTERNO */}
        <div className="border-t border-rose-100 pt-4 text-center">
          <button
            onClick={() => navigate('/')}
            className="bg-stone-900 text-white text-[10px] font-medium tracking-[0.2em] uppercase px-6 py-2.5 hover:bg-stone-800 transition cursor-pointer"
          >
            Entendido / Volver al Comercio
          </button>
        </div>

      </div>
    </div>
  );
}