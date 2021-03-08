---
title: Crossfeed API
---

The Crossfeed API can be used to programmatically access and modify Crossfeed's data.

### Creating an API key

To create an API key, go to My Account -> My Settings and click "Generate API Key". When calling the REST API, the API key must be passed as the value of the `Authorization` header.

### Sample code

Here is some sample code that calls the Crossfeed API from Python:

```python
import requests

r = requests.get(
    'https://api.crossfeed.cyber.dhs.gov/users/me',
    headers={'Authorization': 'XXXXXXX'}
)
print(r.json)
```

### API Reference
