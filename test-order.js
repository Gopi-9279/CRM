const axios = require('axios');

async function testOrder() {
  try {
    // 1. Login
    const loginRes = await axios.post('http://localhost:4000/api/v1/auth/login', {
      email: 'admin@demo.com',
      password: 'password123'
    });
    
    // Extract cookie
    const cookies = loginRes.headers['set-cookie'];
    
    // 2. Create Order
    const orderRes = await axios.post('http://localhost:4000/api/v1/orders', {
      customer_reference: 'PO-9923',
      items: [
        {
          item_id: '22222222-2222-2222-2222-222222222222', // Blue Paint
          location_id: '7bb56c28-97c7-43db-b035-77cf8d132b49', // WH-A
          batch_id: 'b0000000-0000-0000-0000-222222222222', // DEFAULT batch for Blue Paint
          quantity_requested: 52
        }
      ]
    }, {
      headers: { Cookie: cookies.join('; ') }
    });
    
    console.log('Success:', orderRes.data);
  } catch (err) {
    if (err.response) {
      console.error('Error status:', err.response.status);
      console.error('Error data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
  }
}

testOrder();
