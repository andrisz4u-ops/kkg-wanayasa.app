export interface SlideTemplate { name: string; category: string; description: string; cover: 'poster' | 'field' | 'split' | 'editorial'; body: 'tiles' | 'rail' | 'editorial'; font: string; headingFont: string; colors: { background: string; paper: string; ink: string; muted: string; primary: string; soft: string; secondary: string } }
export declare const slideTemplates: Record<'kelas-ceria' | 'jelajah-ipas' | 'matematika-visual' | 'cerita-budaya', SlideTemplate>;
export declare function resolveTemplateId(id: string): keyof typeof slideTemplates;
export declare function getTemplate(id: string): SlideTemplate;
export declare const slideLayouts: { id: string; name: string }[];
