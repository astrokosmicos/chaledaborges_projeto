FROM php:8.3-apache
RUN docker-php-ext-install pdo_mysql && a2enmod rewrite headers && sed -i "/<Directory \/var\/www\/>/,/<\/Directory>/s/AllowOverride None/AllowOverride All/" /etc/apache2/apache2.conf
COPY public/ /var/www/html/
COPY src/ /var/www/app/
RUN printf "<Directory /var/www/html>\nAllowOverride All\nRequire all granted\n</Directory>\n" > /etc/apache2/conf-available/chale.conf && a2enconf chale
RUN chown -R www-data:www-data /var/www/html
