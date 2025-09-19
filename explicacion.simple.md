  Playwright E2E Test - Tienda Virtual 

Este proyecto contiene una prueba automatizada end-to-end usando Playwright con el patrón Page Object Model 
El flujo fue implementado sobre la tienda real:  
https://www.floristeriamundoflor.com/

¿Qué valida esta prueba?

Se testea un flujo completo de carrito en WooCommerce, desde la navegación hasta dejar el carrito vacío.  
Pasos:

1. Cargar la página principal
2. Ir a la categoría de productos
3. Ordenar por precio de menor a mayor
4. Ingresar al detalle del primer producto
5. Agregarlo al carrito
6. Ir al carrito
7. Eliminar el producto
8. Verificar que el carrito esté vacío (items = 0 o subtotal = 0)
9. Validar que se muestre el mensaje Tu carrito está vacío



 Estructura del Proyecto:

tests/e2e/cumple.spec.ts
 Es el archivo donde tengo toda la prueba E2E que navega por el sitio: entra al home, elige una categoría, selecciona un producto, lo agrega al carrito, lo elimina, y valida todo.

src/pages/
 Acá están todas las páginas organizadas siguiendo el patrón Page Object Model (POM). Cada archivo representa una sección distinta del sitio:

home.page.ts:  Encapsula todo lo que se hace en el home (navegación, validaciones, etc).

category.page.ts:  Todo lo relacionado con la vista de categorías o listados de productos.

product.page.ts:  Se encarga de los detalles del producto (nombre, precio, botón de agregar).

cart.page.ts:  Maneja lo que pasa en el carrito de compras (items, subtotal, mensaje de vacío, etc).

playwright.config.ts
Es la configuración general del proyecto: ahí defino el navegador, baseURL, maximizar ventana, reporter, screenshots, etc.

README.md
Este archivo que explica todo de forma clara y con cariño 

Todo el código está separado por responsabilidad y es fácil de mantener.


 Cómo correr el test

1. Instala las dependencias

bash
npm install


2. Corre la prueba en modo visible 

bash
npx playwright test tests/e2e/amor.spec.ts --headed

bash
npx playwright test tests/e2e/cumple.spec.ts --headed


bash
npx playwright test


 Ver reporte de ejecución

bash
npx playwright show-report


Esto abrirá un reporte HTML con capturas, logs y videos si falló algo.


Algunos detalles técnicos

- Se usa el patrón POM para que las páginas estén organizadas y desacopladas.
- Se aplican buenas prácticas de sincronización.
- El test no falla por condiciones frágiles.
- Se validan tanto el número de ítems como el subtotal del carrito.
- Se verifica el mensaje visual `"Tu carrito está vacío"` con expresiones regulares.


Sergio Lara Díaz 
 QA Automation Engineer  
 sergiolaradiaz3@gmail.com  


 Comentario final

Este test fue desarrollado como parte de una prueba técnica. Busqué aplicar buenas prácticas, código limpio y evitar flakiness. Todo el flujo está basado en una tienda WooCommerce real, lo que permite validar un escenario muy cercano a producción.