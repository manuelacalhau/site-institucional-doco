# Site institucional da Agência doco

Site estático multipágina criado a partir da base estratégica da Agência doco no Obsidian.

## Páginas

- Home
- Sobre nós
- Produtos
- Blog
- 13 artigos no blog, incluindo os 10 artigos SEO criados em 19/06/2026

## Executar localmente

Sirva a pasta com qualquer servidor HTTP estático. Em produção, use o `Dockerfile`, que inclui Nginx e cabeçalhos de segurança.

## Deploy

O site é servido por Nginx sem privilégios administrativos, na porta `8080`.

O pacote inclui:

- cabeçalhos de segurança no `nginx.conf`;
- sitemap e robots;
- imagens dos artigos em `assets/blog`;
- página pública de contato de segurança em `security.txt`.

## Créditos das imagens

Imagens gratuitas utilizadas sob a licença do Unsplash:

- [Labirinto laranja](https://unsplash.com/photos/a-complex-orange-maze-is-pictured-Lu3vZL2yd2o), por Hirzul Maulana.
- [Notebook com painel digital](https://unsplash.com/photos/a-modern-laptop-displaying-a-dark-themed-dashboard-6-0ajRI1cgs), por Neil Fernandez.
- [Conversa profissional](https://unsplash.com/photos/a-woman-sitting-on-a-couch-talking-to-another-woman-RqR2pnTpmHA), por Vitaly Gariev.
