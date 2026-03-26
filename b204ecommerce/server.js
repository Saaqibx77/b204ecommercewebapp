const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const app = express();
const PORT = 3000;
app.use(express.json());
app.use(express.static('public'));
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });
function readJSON(file) {
  const filepath = path.join(__dirname, 'data', file);
  if (!fs.existsSync(filepath)) fs.writeFileSync(filepath, '[]');
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}
function writeJSON(file, data) {
  const filepath = path.join(__dirname, 'data', file);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}
app.get('/api/products', (req, res) => {
  const products = readJSON('products.json');
  res.json(products);
});
app.get('/api/products/:id', (req, res) => {
  const products = readJSON('products.json');
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});
app.post('/api/products', upload.single('image'), (req, res) => {
  const products=readJSON('products.json');
  const newId=products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
  const newProduct = {
    id: newId,
    name: req.body.name,
    category: req.body.category,
    cost:parseFloat(req.body.cost),
    image:req.file?'/uploads/'+req.file.filename :'/uploads/placeholder.jpg'
  };
  products.push(newProduct);
  writeJSON('products.json', products);
  res.json({ success: true, product: newProduct });
});
app.get('/api/cart', (req, res) => {
  const cart = readJSON('cart.json');
  res.json(cart);
});
app.post('/api/cart', (req, res) => 
{
  const cart = readJSON('cart.json');
  const { productId, name, cost, image }=req.body;
  const existing = cart.find(item => item.productId === productId);
  if (existing) 
{
    existing.quantity= existing.quantity+1;
  }
 else 
{
    cart.push({ productId, name, cost, image, quantity:1 });
  }
  writeJSON('cart.json', cart);
  res.json({ success: true, cart });
});
app.put('/api/cart/:productId', (req, res) => {
  const cart=readJSON('cart.json');
  const item=cart.find(i => i.productId === parseInt(req.params.productId));
  if (!item) return res.status(404).json({ error: 'Item not in cart' });
  item.quantity=req.body.quantity;
  if (item.quantity <= 0) {
    const index=cart.indexOf(item);
    cart.splice(index, 1);
  }

  writeJSON('cart.json', cart);
  res.json({ success: true, cart });
});


app.delete('/api/cart/:productId', (req, res) => {
  let cart = readJSON('cart.json');
  cart = cart.filter(i => i.productId !== parseInt(req.params.productId));
  writeJSON('cart.json', cart);
  res.json({ success: true, cart });
});


app.post('/api/checkout', (req, res) => {
  const cart = readJSON('cart.json');
  if (cart.length === 0) return res.status(400).json({ error: 'nothing in cart' });

  const orders = readJSON('orders.json');
  const { email, address } = req.body;

  const total = cart.reduce((sum, item) => sum + item.cost * item.quantity, 0);
  const order = {
    id: orders.length + 1,
    items: [...cart],
    total: total.toFixed(2),
    email: email || 'saaqib@example.com',
    address: address,
    paymentMethod:'ByPaypal',
    date: new Date()
  };
  orders.push(order);
  writeJSON('orders.json', orders);
  writeJSON('cart.json', []);
  res.json({ success: true, order });
});
app.get('/api/orders', (req, res) => {
  const orders = readJSON('orders.json');
  res.json(orders);
});
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});
app.listen(PORT, () => {
  console.log('Server starts : http://localhost:' + PORT +'Port');
});
