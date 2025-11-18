FROM php:7.1.9-apache

# Install PHP extensions required for Moodle 3.7
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libxml2-dev \
    libzip-dev \
    libicu-dev \
    libcurl4-openssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Configure and install PHP extensions
RUN docker-php-ext-configure gd --with-freetype-dir=/usr/include/ --with-jpeg-dir=/usr/include/ \
    && docker-php-ext-install -j$(nproc) \
    gd \
    mysqli \
    pdo \
    pdo_mysql \
    intl \
    mbstring \
    curl \
    zip \
    soap \
    xml \
    opcache

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Set recommended PHP.ini settings for Moodle
RUN { \
    echo 'upload_max_filesize = 256M'; \
    echo 'post_max_size = 256M'; \
    echo 'memory_limit = 256M'; \
    echo 'max_execution_time = 300'; \
    echo 'max_input_time = 300'; \
    echo 'display_errors = Off'; \
    echo 'log_errors = On'; \
    echo 'error_log = /var/log/php_errors.log'; \
} > /usr/local/etc/php/conf.d/moodle.ini

# Set working directory
WORKDIR /var/www/html

# Expose port
EXPOSE 80

# Start Apache
CMD ["apache2-foreground"]
