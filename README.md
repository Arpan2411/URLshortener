##Docker cheatsheet
# Start all services in detached mode
npm run docker:up

# Or manually
docker-compose up -d

# View logs
npm run docker:logs

# Or for specific service
docker-compose logs -f app
docker-compose logs -f mongodb
docker-compose logs -f redis

# Stop all services
npm run docker:down

# Rebuild and start
npm run docker:rebuild

# Clean everything (including volumes)
npm run docker:clean

# Check container status
docker-compose ps

# Access MongoDB container
docker exec -it urlshortner-mongodb mongosh -u admin -p admin123

# Access Redis container
docker exec -it urlshortner-redis redis-cli -a redis123

# Access app container
docker exec -it urlshortner-app sh

# View container logs directly
docker logs urlshortner-app -f

# Inspect container
docker inspect urlshortner-app