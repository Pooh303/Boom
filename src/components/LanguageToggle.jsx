import React, { useContext } from 'react';
import { PageContext } from './PageContextProvider';

export default function LanguageToggle() {
    const { language, changeLanguage } = useContext(PageContext);

    return (
        <div 
            onClick={() => changeLanguage(language === 'th' ? 'en' : 'th')}
            className="clickable flex items-center justify-center p-2 px-3 mx-2 bg-neutral rounded-full text-sm font-bold text-neutral-content opacity-80 hover:opacity-100 transition-opacity"
        >
            {language === 'th' ? 'TH' : 'EN'}
        </div>
    );
}
