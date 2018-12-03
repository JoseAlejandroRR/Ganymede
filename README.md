# Ganymede
exposes the web service API, handles persistence, and delegates search jobs. Persistence is done in a MongoDB database


## Routes

### Access Tokeb
> /api/auth
 
 Endpoint for get the Access Token. Required a object json in body with credentials like:
 
 ```sh
 curl -X POST \
  'http://localhost:5000/api/auth' \
  -H 'Content-Type: application/json' \
  -H 'cache-control: no-cache' \
  -d '{
	 "username": "user",
   "password": "password"
}'
  ```
  
### Get Search Jobs Crawlers 
  
  > /api/product/search-orders
 
 Endpoint for create a search job according with data send.
 
 ```sh
 curl -X GET \
  'http://localhost:5000/api/product/search-orders?page=1' \
  -H 'Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIqLmNsYXJvdmlkZW8ubmV0IiwiaWF0IjoxNTQzMjQ1NDk4LCJleHAiOjE1NDMyNDcyOTgsInN1YiI6ImFtY28ifQ.5FqImJv4qztTe7QBRu_rDRQgFVhoUfVbfhiQ5Mk-dvY' \
  -H 'Content-Type: application/json' \
  -H 'cache-control: no-cache' \
  ```
  
### Create Search Job 
  
  > /api/product/search-orders
 
 Endpoint for create a search job according with data send.
 
| PROVIDER | REQUIRED | OPTIONAL |
| ------ | ------ | ------ |
| mercadolibre | { query, provider, callbackUrl} | options: { username, password }|
| falabella | { query, provider } | |
 
 ```sh
 curl -X POST \
  'http://localhost:5000/api/product/search' \
  -H 'Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIqLmNsYXJvdmlkZW8ubmV0IiwiaWF0IjoxNTQzMjQ1NDk4LCJleHAiOjE1NDMyNDcyOTgsInN1YiI6ImFtY28ifQ.5FqImJv4qztTe7QBRu_rDRQgFVhoUfVbfhiQ5Mk-dvY' \
  -H 'Content-Type: application/json' \
  -H 'cache-control: no-cache' \
  -d '{
	"query":"Samsung Smart Tv",
	"provider" : "mercadolibre",
	"options": {
		"username":"joserealza@gmail.com",
		"password": "mySupperp4assword"
	},
	"callbackUrl" : "http://localhost:8080/webhooks"
}'
  ```
  
  ### Get Search Data Object  
  
  > /api/product/search-orders
 
 Endpoint for get a search job with data crawler gotten.
 
 ```sh
 curl -X GET \
  'http://localhost:5000/api/product/search-order/da56d46as4d6a4d8' \
  -H 'Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIqLmNsYXJvdmlkZW8ubmV0IiwiaWF0IjoxNTQzMjQ1NDk4LCJleHAiOjE1NDMyNDcyOTgsInN1YiI6ImFtY28ifQ.5FqImJv4qztTe7QBRu_rDRQgFVhoUfVbfhiQ5Mk-dvY' \
  -H 'Content-Type: application/json' \
  -H 'cache-control: no-cache' \
  ```
  
 ### Get Search Objects by Category  
  
  > /api/product/search-orders
 
 Endpoint for get a collection with search objects with the same category stored
 
 ```sh
 curl -X GET \
  'http://localhost:5000//api/product/category/87asd46as4d684asd6' \
  -H 'Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIqLmNsYXJvdmlkZW8ubmV0IiwiaWF0IjoxNTQzMjQ1NDk4LCJleHAiOjE1NDMyNDcyOTgsInN1YiI6ImFtY28ifQ.5FqImJv4qztTe7QBRu_rDRQgFVhoUfVbfhiQ5Mk-dvY' \
  -H 'Content-Type: application/json' \
  -H 'cache-control: no-cache' \
  ```
  
