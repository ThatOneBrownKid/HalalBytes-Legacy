# Use official Ruby image
FROM ruby:3.2.8

# Set working directory
WORKDIR /app

# Install dependencies (Debian-based Ruby image)
RUN apt-get update -qq && apt-get install -y build-essential libpq-dev nodejs

# Copy Gemfile and install gems first (better layer caching)
COPY Gemfile* ./
RUN bundle install

# Copy project files
COPY . .

# Create Temp Server directory
RUN mkdir -p tmp/pids

# Expose app port (update if not 3000)
EXPOSE 3000

# Run your app (update for Sinatra/Puma/Sidekiq/etc.)
CMD ["rails", "server", "-b", "0.0.0.0", "-p", "3000"]
