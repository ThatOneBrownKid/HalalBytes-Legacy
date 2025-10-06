# Use official Ruby image
FROM ruby:3.2.8

# Set working directory
WORKDIR /app

# Install dependencies (Debian-based Ruby image)
RUN apt-get update -qq && apt-get install -y build-essential libpq-dev nodejs yarn

# Copy Gemfile and install gems first (better layer caching)
COPY Gemfile* ./
RUN bundle install

# Copy project files
COPY . .

# Autocorrect dependecies and convert from windows to unix
RUN apt-get update && apt-get install -y aspell aspell-en dos2unix && find bin -type f -exec dos2unix {} \; && chmod +x bin/rails


# Create Temp Server directory
RUN mkdir -p tmp/pids

# Expose app port (update if not 3000)
EXPOSE 3000

# Use an entrypoint script
ENTRYPOINT ["./entrypoint.sh"]

