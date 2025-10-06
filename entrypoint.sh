#!/bin/bash
set -e

# Default to production if RAILS_ENV not set
RAILS_ENV=${RAILS_ENV:-production}

# Precompile assets
bin/rails assets:precompile

# Start Puma
bin/rails server -b 0.0.0.0 -p 3000
