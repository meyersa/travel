# Travel Planner

A visualizer and generator for trip planning. 

## Goal 

The goal of this project is to have a travel agent powered by GPTs. Instead of just laying out a trip, it interacts with Delta, TripAdvisor, and Bookings.com to find rooms, flights, and things to do. 

From there, it creates an interactive map friendly view of the trip. Using Leaflet JS as a way to map it, interacting with Apple Maps so they can be used on your phone. 

# Use

Clone repository and run `npm i` to install necessary packages 

Some ENVs will also need to be set (optionally in a .env at the root)
- MONGO_DB=database to use
- MONGO_URL=mongodb://user:pass@host:27017/
- GOOGLE_CONSOLE_ID=Search console ID
- GOOGLE_API_KEY=API key for search console