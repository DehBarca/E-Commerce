// Importar las dependencias necesarias
const express = require('express'); // Framework para crear el servidor
const fs = require('fs').promises; // Módulo para trabajar con archivos de forma asíncrona
const path = require('path'); // Módulo para trabajar con rutas de archivos
const cors = require('cors'); // Importar el middleware CORS
const shortid = require('shortid'); // Importar el módulo shortid

const app = express(); // Crear una instancia de la aplicación Express

// Middleware global para parsear JSON en las solicitudes
app.use(express.json());
app.use(cors()); // Habilitar CORS para todas las rutas

// Definir las rutas de los archivos JSON
const productsFilePath = path.join(__dirname, 'products.json'); // Ruta del archivo de productos
const cartFilePath = path.join(__dirname, 'cart.json'); // Ruta del archivo del carrito

// Función para leer el archivo JSON de productos
async function getProducts() {
  const data = await fs.readFile(productsFilePath, 'utf-8'); // Leer el archivo de productos
  return JSON.parse(data); // Convertir el contenido del archivo a un objeto JSON
}

// Función para escribir en el archivo JSON de productos
async function saveProducts(products) {
  const data = JSON.stringify(products, null, 2); // Convertir el objeto a una cadena JSON con formato
  await fs.writeFile(productsFilePath, data, 'utf-8'); // Guardar los datos en el archivo
}

// Función para leer el archivo JSON del carrito
async function getCart() {
  try {
    const data = await fs.readFile(cartFilePath, 'utf-8'); // Leer el archivo del carrito
    return JSON.parse(data); // Convertir el contenido del archivo a un objeto JSON
  } catch (error) {
    // Si el archivo no existe, devolver un carrito vacío
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error; // Lanzar otros errores
  }
}

// Función para escribir en el archivo JSON del carrito
async function saveCart(cart) {
  const data = JSON.stringify(cart, null, 2); // Convertir el objeto a una cadena JSON con formato
  await fs.writeFile(cartFilePath, data, 'utf-8'); // Guardar los datos en el archivo
}

// Ruta raíz para verificar que el servidor está funcionando
app.get('/', (req, res) => {
  res.send('e-commerce app práctica 3'); // Respuesta simple
});

// Ruta para obtener todos los productos con filtros opcionales
app.get('/products', async (req, res) => {
  try {
    const products = await getProducts(); // Obtener los productos del archivo

    // Verificar si el usuario es administrador
    const isAdmin = req.headers["x-auth"] === "admin";

    // Filtrar los productos según el rol
    let filteredProducts = products.map(product => {
      if (isAdmin) {
        return product; // Si es admin, devolver el producto completo
      } else {
        // Si no es admin, excluir el campo stock
        const { stock, ...productWithoutStock } = product;
        return productWithoutStock;
      }
    });

    // Aplicar filtros por title y category si están presentes en los parámetros de consulta
    const { title, category } = req.query;

    if (title) {
      filteredProducts = filteredProducts.filter(product =>
        product.title.toLowerCase().includes(title.toLowerCase())
      );
    }

    if (category) {
      filteredProducts = filteredProducts.filter(product =>
        product.category.toLowerCase() === category.toLowerCase()
      );
    }

    res.json(filteredProducts); // Enviar los productos filtrados como respuesta en formato JSON
  } catch (error) {
    res.status(500).json({ message: 'Error al leer el archivo de productos' }); // Respuesta de error
  }
});

// Ruta para obtener un producto por su ID
app.get('/products/:id', async (req, res) => {
  try {
    const products = await getProducts(); // Obtener los productos del archivo
    const product = products.find(p => p.uuid === req.params.id); // Buscar el producto por su ID
    if (product) {
      res.json(product); // Enviar el producto encontrado
    } else {
      res.status(404).json({ message: 'Producto no encontrado' }); // Producto no encontrado
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al leer el archivo de productos' }); // Respuesta de error
  }
});

// Ruta para obtener todos los artículos del carrito
app.get('/cart', async (req, res) => {
  try {
    // Verificar si el usuario es "juan"
    if (req.headers["x-user"] !== "juan") {
      return res.status(403).json({ message: 'Acceso denegado: Solo el usuario "juan" puede acceder al carrito' });
    }

    const cart = await getCart(); // Obtener los datos del carrito
    res.json(cart); // Enviar el carrito como respuesta en formato JSON
  } catch (error) {
    res.status(500).json({ message: 'Error al leer el archivo del carrito' }); // Respuesta de error
  }
});

// Ruta para agregar un artículo al carrito
app.post('/cart', async (req, res) => {
  try {
    // Verificar si el usuario es "juan"
    if (req.headers["x-user"] !== "juan") {
      return res.status(403).json({ message: 'Acceso denegado: Solo el usuario "juan" puede agregar artículos al carrito' });
    }

    const cart = await getCart(); // Obtener los datos del carrito
    const newItem = req.body; // Obtener el nuevo artículo del cuerpo de la solicitud
    cart.push(newItem); // Agregar el nuevo artículo al carrito
    await saveCart(cart); // Guardar el carrito actualizado
    res.status(201).json(newItem); // Respuesta con el artículo agregado
  } catch (error) {
    res.status(500).json({ message: 'Error al escribir en el archivo del carrito' }); // Respuesta de error
  }
});

// Ruta para eliminar un artículo del carrito por su ID
app.delete('/cart/:id', async (req, res) => {
  try {
    const cart = await getCart(); // Obtener los datos del carrito
    const itemIndex = cart.findIndex(item => item.uuid === req.params.id); // Buscar el índice del artículo por su ID

    if (itemIndex !== -1) {
      const [deletedItem] = cart.splice(itemIndex, 1); // Eliminar el artículo del carrito
      await saveCart(cart); // Guardar el carrito actualizado
      res.status(200).json(deletedItem); // Respuesta con el artículo eliminado
    } else {
      res.status(404).json({ message: 'Artículo no encontrado en el carrito' }); // Artículo no encontrado
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el artículo del carrito' }); // Respuesta de error
  }
});

// Ruta para agregar un nuevo producto
app.post('/products', async (req, res) => {
  try {
    // Verificar si el usuario es administrador
    if (req.headers["x-auth"] !== "admin") {
      return res.status(403).json({ message: 'Acceso denegado: Solo los administradores pueden crear productos' });
    }

    const products = await getProducts(); // Obtener los productos del archivo
    const newProduct = req.body; // Obtener el nuevo producto del cuerpo de la solicitud

    // Generar un uuid automáticamente si no se proporciona
    if (!newProduct.uuid) {
      newProduct.uuid = shortid.generate();
    }

    // Validar que el producto tenga las claves necesarias
    if (!newProduct.title || !newProduct.pricePerUnit) {
      return res.status(400).json({ 
        message: 'Faltan parámetros obligatorios: title, pricePerUnit' 
      });
    }

    // Validar que no exista un producto con el mismo UUID
    const existingProduct = products.find(p => p.uuid === newProduct.uuid);
    if (existingProduct) {
      return res.status(400).json({ 
        message: 'Ya existe un producto con el mismo UUID' 
      });
    }

    // Agregar el nuevo producto
    products.push(newProduct);
    await saveProducts(products); // Guardar los productos actualizados

    res.status(201).json(newProduct); // Respuesta con el producto agregado
  } catch (error) {
    res.status(400).json({ message: 'Error al crear el producto' }); // Respuesta de error
  }
});

// Ruta para eliminar un producto por su ID
app.delete('/products/:id', async (req, res) => {
  try {
    // Verificar si el usuario es administrador
    if (req.headers["x-auth"] !== "admin") {
      return res.status(403).json({ message: 'Acceso denegado: Solo los administradores pueden eliminar productos' });
    }

    const products = await getProducts(); // Obtener los productos del archivo
    const productIndex = products.findIndex(p => p.uuid === req.params.id); // Buscar el índice del producto por su ID
    if (productIndex !== -1) {
      const [deletedProduct] = products.splice(productIndex, 1); // Eliminar el producto
      await saveProducts(products); // Guardar los productos actualizados
      res.status(200).json(deletedProduct); // Respuesta con el producto eliminado
    } else {
      res.status(404).json({ message: 'Producto no encontrado' }); // Producto no encontrado
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el producto' }); // Respuesta de error
  }
});

// Ruta para actualizar un producto por su ID
app.put('/products/:id', async (req, res) => {
  try {
    // Verificar si el usuario es administrador
    if (req.headers["x-auth"] !== "admin") {
      return res.status(403).json({ message: 'Acceso denegado: Solo los administradores pueden actualizar productos' });
    }

    const products = await getProducts(); // Obtener los productos del archivo
    const productIndex = products.findIndex(p => p.uuid === req.params.id); // Buscar el índice del producto por su ID

    if (productIndex !== -1) {
      const product = products[productIndex]; // Producto original
      const allowedKeys = Object.keys(product); // Claves permitidas basadas en el producto original
      const invalidKeys = Object.keys(req.body).filter(key => !allowedKeys.includes(key)); // Validar claves no permitidas

      if (invalidKeys.length > 0) {
        return res.status(400).json({ 
          message: `Parámetros no válidos: ${invalidKeys.join(', ')}` 
        });
      }

      // Actualizar el producto
      const updatedProduct = { ...product, ...req.body }; // Combinar el producto original con los nuevos datos
      products[productIndex] = updatedProduct; // Actualizar el producto en la lista

      await saveProducts(products); // Guardar los productos actualizados
      res.status(200).json(updatedProduct); // Respuesta con el producto actualizado
    } else {
      res.status(404).json({ message: 'Producto no encontrado' }); // Producto no encontrado
    }
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar el producto' }); // Respuesta de error
  }
});

// Levantar el servidor en el puerto 3100
app.listen(3100, () => {
  console.log('Servidor corriendo en http://localhost:3100'); // Mensaje al iniciar el servidor
});