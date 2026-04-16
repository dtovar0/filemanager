from app import app
import json

with app.test_client() as c:
    response = c.get('/admin/areas-api')
    print(f"Status Code: {response.status_code}")
    print("Response Data:")
    print(response.get_data(as_text=True))
