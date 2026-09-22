const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src/app/features/free-tools/tools/workforce');

const updateSeoReplacement = (slug) => `  private updateSeo(): void {
    const tool = getToolBySlug('${slug}');
    if (!tool) return;
    const t = tool.seoTitle;
    const d = tool.seoDescription;
    const url = \`https://www.briskpeople.com/free-workforce-tools/\${tool.slug}\`;
    
    this.title.setTitle(t);
    this.meta.updateTag({ name: 'description',        content: d });
    this.meta.updateTag({ name: 'keywords',           content: tool.keywords });
    this.meta.updateTag({ property: 'og:title',       content: t });
    this.meta.updateTag({ property: 'og:description', content: d });
    this.meta.updateTag({ property: 'og:type',        content: 'website' });
    this.meta.updateTag({ property: 'og:url',         content: url });
    this.meta.updateTag({ name: 'twitter:card',       content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title',      content: t });
    this.meta.updateTag({ name: 'twitter:description', content: d });
    
    // Set canonical tag
    let canonicalLink = this.document.querySelector('link[rel="canonical"]');
    if (canonicalLink) canonicalLink.remove();
    canonicalLink = this.document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    canonicalLink.setAttribute('href', url);
    this.document.head.appendChild(canonicalLink);
  }`;

const injectJsonLdReplacement = (slug) => `  private injectJsonLd(): void {
    const tool = getToolBySlug('${slug}');
    if (!tool) return;
    const url = \`https://www.briskpeople.com/free-workforce-tools/\${tool.slug}\`;
    const schemas: any[] = [
      {
        '@context': 'https://schema.org', '@type': 'WebApplication',
        name: tool.title, applicationCategory: 'BusinessApplication',
        operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        description: tool.seoDescription,
        url: url
      },
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.briskpeople.com' },
          { '@type': 'ListItem', position: 2, name: 'Free Workforce Tools', item: 'https://www.briskpeople.com/free-workforce-tools' },
          { '@type': 'ListItem', position: 3, name: tool.title, item: url }
        ]
      }
    ];

    if (this.faqs && this.faqs.length > 0) {
      schemas.push({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: this.faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
      });
    }

    this.jsonLdScript = this.document.createElement('script');
    this.jsonLdScript.type = 'application/ld+json';
    this.jsonLdScript.text = JSON.stringify(schemas);
    this.document.head.appendChild(this.jsonLdScript);
  }`;

function processDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
            processDirectory(fullPath);
        } else if (entry.name.endsWith('.component.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // Extract slug
            const slugMatch = content.match(/free-workforce-tools\/([^']+)'/);
            if (!slugMatch) {
                console.log('Could not find slug in:', fullPath);
                continue;
            }
            const slug = slugMatch[1];
            
            // Replace updateSeo
            const seoRegex = /  private updateSeo\(\): void \{[\s\S]*?(?=  private injectJsonLd|  ngOnDestroy)/;
            content = content.replace(seoRegex, updateSeoReplacement(slug) + '\n\n');
            
            // Replace injectJsonLd
            const jsonLdRegex = /  private injectJsonLd\(\): void \{[\s\S]*?(?=  ngOnDestroy)/;
            content = content.replace(jsonLdRegex, injectJsonLdReplacement(slug) + '\n\n');
            
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log('Updated SEO for:', entry.name);
        }
    }
}

processDirectory(baseDir);
