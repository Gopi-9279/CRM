const { z } = require('zod');
try {
  z.string().uuid().parse('22222222-2222-2222-2222-222222222222');
  console.log('Valid');
} catch (e) {
  console.log('Invalid:', e.errors[0].message);
}
