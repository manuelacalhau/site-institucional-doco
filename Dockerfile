FROM nginxinc/nginx-unprivileged:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html sobre.html produtos.html blog.html start-digital.html styles.css app.js /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/assets
COPY blog /usr/share/nginx/html/blog
COPY robots.txt sitemap.xml security.txt /usr/share/nginx/html/

EXPOSE 8080
