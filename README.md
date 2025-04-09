# Travel Planner

A visualizer and generator for trip planning. 

## Goal 

The goal of this project is to have a travel agent powered by GPTs. Instead of just laying out a trip, it interacts with Delta, TripAdvisor, and Bookings.com to find rooms, flights, and things to do. 

From there, it creates an interactive map friendly view of the trip. Using Leaflet JS as a way to map it, interacting with Apple Maps so they can be used on your phone. 

## Use

Clone repository and run `npm i` to install necessary packages 

## ENVs 

| Name                  | Description                                             | Default        |
|-----------------------|---------------------------------------------------------|----------------|
| MONGO_DB              | Mongo Database to use                                   |                |
| MONGO_URL             | MongoDB connection string                               |                |
| SERVER_KEY            | Basic API key to use for securing connection            |                |
| OPENAI_KEY            | Key for OpenAPI with ChatGPT access                     |                |
| PORT                  | Port for server to listen on                            | 3000           |
| DEFAULT_TTL           | NodeCache TTL (MS)                                      | 3600           |
| LOG_LEVEL             | Log level                                               | debug          |
| IMAGE_SUGGESTED_LIMIT | Number of images to generate per trip                   | 5              |
| CHATGPT_RETRIES       | Number of retries for ChatGPT                           | 3              |