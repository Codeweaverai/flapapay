import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import CountryFlag from 'react-country-flag';

const COUNTRY_CODES = [
    { code: 'AF', dial: '+93', name: 'Afghanistan' },
    { code: 'AL', dial: '+355', name: 'Albania' },
    { code: 'DZ', dial: '+213', name: 'Algeria' },
    { code: 'AS', dial: '+1-684', name: 'American Samoa' },
    { code: 'AD', dial: '+376', name: 'Andorra' },
    { code: 'AO', dial: '+244', name: 'Angola' },
    { code: 'AI', dial: '+1-264', name: 'Anguilla' },
    { code: 'AQ', dial: '+672', name: 'Antarctica' },
    { code: 'AG', dial: '+1-268', name: 'Antigua and Barbuda' },
    { code: 'AR', dial: '+54', name: 'Argentina' },
    { code: 'AM', dial: '+374', name: 'Armenia' },
    { code: 'AW', dial: '+297', name: 'Aruba' },
    { code: 'AU', dial: '+61', name: 'Australia' },
    { code: 'AT', dial: '+43', name: 'Austria' },
    { code: 'AZ', dial: '+994', name: 'Azerbaijan' },
    { code: 'BS', dial: '+1-242', name: 'Bahamas' },
    { code: 'BH', dial: '+973', name: 'Bahrain' },
    { code: 'BD', dial: '+880', name: 'Bangladesh' },
    { code: 'BB', dial: '+1-246', name: 'Barbados' },
    { code: 'BY', dial: '+375', name: 'Belarus' },
    { code: 'BE', dial: '+32', name: 'Belgium' },
    { code: 'BZ', dial: '+501', name: 'Belize' },
    { code: 'BJ', dial: '+229', name: 'Benin' },
    { code: 'BM', dial: '+1-441', name: 'Bermuda' },
    { code: 'BT', dial: '+975', name: 'Bhutan' },
    { code: 'BO', dial: '+591', name: 'Bolivia' },
    { code: 'BA', dial: '+387', name: 'Bosnia and Herzegovina' },
    { code: 'BW', dial: '+267', name: 'Botswana' },
    { code: 'BR', dial: '+55', name: 'Brazil' },
    { code: 'IO', dial: '+246', name: 'British Indian Ocean Territory' },
    { code: 'VG', dial: '+1-284', name: 'British Virgin Islands' },
    { code: 'BN', dial: '+673', name: 'Brunei' },
    { code: 'BG', dial: '+359', name: 'Bulgaria' },
    { code: 'BF', dial: '+226', name: 'Burkina Faso' },
    { code: 'BI', dial: '+257', name: 'Burundi' },
    { code: 'KH', dial: '+855', name: 'Cambodia' },
    { code: 'CM', dial: '+237', name: 'Cameroon' },
    { code: 'CA', dial: '+1', name: 'Canada' },
    { code: 'CV', dial: '+238', name: 'Cape Verde' },
    { code: 'KY', dial: '+1-345', name: 'Cayman Islands' },
    { code: 'CF', dial: '+236', name: 'Central African Republic' },
    { code: 'TD', dial: '+235', name: 'Chad' },
    { code: 'CL', dial: '+56', name: 'Chile' },
    { code: 'CN', dial: '+86', name: 'China' },
    { code: 'CX', dial: '+61', name: 'Christmas Island' },
    { code: 'CC', dial: '+61', name: 'Cocos Islands' },
    { code: 'CO', dial: '+57', name: 'Colombia' },
    { code: 'KM', dial: '+269', name: 'Comoros' },
    { code: 'CK', dial: '+682', name: 'Cook Islands' },
    { code: 'CR', dial: '+506', name: 'Costa Rica' },
    { code: 'HR', dial: '+385', name: 'Croatia' },
    { code: 'CU', dial: '+53', name: 'Cuba' },
    { code: 'CW', dial: '+599', name: 'Curacao' },
    { code: 'CY', dial: '+357', name: 'Cyprus' },
    { code: 'CZ', dial: '+420', name: 'Czech Republic' },
    { code: 'CD', dial: '+243', name: 'Democratic Republic of the Congo' },
    { code: 'DK', dial: '+45', name: 'Denmark' },
    { code: 'DJ', dial: '+253', name: 'Djibouti' },
    { code: 'DM', dial: '+1-767', name: 'Dominica' },
    { code: 'DO', dial: '+1-809, 1-829, 1-849', name: 'Dominican Republic' },
    { code: 'TL', dial: '+670', name: 'East Timor' },
    { code: 'EC', dial: '+593', name: 'Ecuador' },
    { code: 'EG', dial: '+20', name: 'Egypt' },
    { code: 'SV', dial: '+503', name: 'El Salvador' },
    { code: 'GQ', dial: '+240', name: 'Equatorial Guinea' },
    { code: 'ER', dial: '+291', name: 'Eritrea' },
    { code: 'EE', dial: '+372', name: 'Estonia' },
    { code: 'ET', dial: '+251', name: 'Ethiopia' },
    { code: 'FK', dial: '+500', name: 'Falkland Islands' },
    { code: 'FO', dial: '+298', name: 'Faroe Islands' },
    { code: 'FJ', dial: '+679', name: 'Fiji' },
    { code: 'FI', dial: '+358', name: 'Finland' },
    { code: 'FR', dial: '+33', name: 'France' },
    { code: 'PF', dial: '+689', name: 'French Polynesia' },
    { code: 'GA', dial: '+241', name: 'Gabon' },
    { code: 'GM', dial: '+220', name: 'Gambia' },
    { code: 'GE', dial: '+995', name: 'Georgia' },
    { code: 'DE', dial: '+49', name: 'Germany' },
    { code: 'GH', dial: '+233', name: 'Ghana' },
    { code: 'GI', dial: '+350', name: 'Gibraltar' },
    { code: 'GR', dial: '+30', name: 'Greece' },
    { code: 'GL', dial: '+299', name: 'Greenland' },
    { code: 'GD', dial: '+1-473', name: 'Grenada' },
    { code: 'GU', dial: '+1-671', name: 'Guam' },
    { code: 'GT', dial: '+502', name: 'Guatemala' },
    { code: 'GG', dial: '+44-1481', name: 'Guernsey' },
    { code: 'GN', dial: '+224', name: 'Guinea' },
    { code: 'GW', dial: '+245', name: 'Guinea-Bissau' },
    { code: 'GY', dial: '+592', name: 'Guyana' },
    { code: 'HT', dial: '+509', name: 'Haiti' },
    { code: 'HN', dial: '+504', name: 'Honduras' },
    { code: 'HK', dial: '+852', name: 'Hong Kong' },
    { code: 'HU', dial: '+36', name: 'Hungary' },
    { code: 'IS', dial: '+354', name: 'Iceland' },
    { code: 'IN', dial: '+91', name: 'India' },
    { code: 'ID', dial: '+62', name: 'Indonesia' },
    { code: 'IR', dial: '+98', name: 'Iran' },
    { code: 'IQ', dial: '+964', name: 'Iraq' },
    { code: 'IE', dial: '+353', name: 'Ireland' },
    { code: 'IM', dial: '+44-1624', name: 'Isle of Man' },
    { code: 'IL', dial: '+972', name: 'Israel' },
    { code: 'IT', dial: '+39', name: 'Italy' },
    { code: 'CI', dial: '+225', name: 'Ivory Coast' },
    { code: 'JM', dial: '+1-876', name: 'Jamaica' },
    { code: 'JP', dial: '+81', name: 'Japan' },
    { code: 'JE', dial: '+44-1534', name: 'Jersey' },
    { code: 'JO', dial: '+962', name: 'Jordan' },
    { code: 'KZ', dial: '+7', name: 'Kazakhstan' },
    { code: 'KE', dial: '+254', name: 'Kenya' },
    { code: 'KI', dial: '+686', name: 'Kiribati' },
    { code: 'XK', dial: '+383', name: 'Kosovo' },
    { code: 'KW', dial: '+965', name: 'Kuwait' },
    { code: 'KG', dial: '+996', name: 'Kyrgyzstan' },
    { code: 'LA', dial: '+856', name: 'Laos' },
    { code: 'LV', dial: '+371', name: 'Latvia' },
    { code: 'LB', dial: '+961', name: 'Lebanon' },
    { code: 'LS', dial: '+266', name: 'Lesotho' },
    { code: 'LR', dial: '+231', name: 'Liberia' },
    { code: 'LY', dial: '+218', name: 'Libya' },
    { code: 'LI', dial: '+423', name: 'Liechtenstein' },
    { code: 'LT', dial: '+370', name: 'Lithuania' },
    { code: 'LU', dial: '+352', name: 'Luxembourg' },
    { code: 'MO', dial: '+853', name: 'Macau' },
    { code: 'MK', dial: '+389', name: 'Macedonia' },
    { code: 'MG', dial: '+261', name: 'Madagascar' },
    { code: 'MW', dial: '+265', name: 'Malawi' },
    { code: 'MY', dial: '+60', name: 'Malaysia' },
    { code: 'MV', dial: '+960', name: 'Maldives' },
    { code: 'ML', dial: '+223', name: 'Mali' },
    { code: 'MT', dial: '+356', name: 'Malta' },
    { code: 'MH', dial: '+692', name: 'Marshall Islands' },
    { code: 'MR', dial: '+222', name: 'Mauritania' },
    { code: 'MU', dial: '+230', name: 'Mauritius' },
    { code: 'YT', dial: '+262', name: 'Mayotte' },
    { code: 'MX', dial: '+52', name: 'Mexico' },
    { code: 'FM', dial: '+691', name: 'Micronesia' },
    { code: 'MD', dial: '+373', name: 'Moldova' },
    { code: 'MC', dial: '+377', name: 'Monaco' },
    { code: 'MN', dial: '+976', name: 'Mongolia' },
    { code: 'ME', dial: '+382', name: 'Montenegro' },
    { code: 'MS', dial: '+1-664', name: 'Montserrat' },
    { code: 'MA', dial: '+212', name: 'Morocco' },
    { code: 'MZ', dial: '+258', name: 'Mozambique' },
    { code: 'MM', dial: '+95', name: 'Myanmar' },
    { code: 'NA', dial: '+264', name: 'Namibia' },
    { code: 'NR', dial: '+674', name: 'Nauru' },
    { code: 'NP', dial: '+977', name: 'Nepal' },
    { code: 'NL', dial: '+31', name: 'Netherlands' },
    { code: 'AN', dial: '+599', name: 'Netherlands Antilles' },
    { code: 'NC', dial: '+687', name: 'New Caledonia' },
    { code: 'NZ', dial: '+64', name: 'New Zealand' },
    { code: 'NI', dial: '+505', name: 'Nicaragua' },
    { code: 'NE', dial: '+227', name: 'Niger' },
    { code: 'NG', dial: '+234', name: 'Nigeria' },
    { code: 'NU', dial: '+683', name: 'Niue' },
    { code: 'KP', dial: '+850', name: 'North Korea' },
    { code: 'MP', dial: '+1-670', name: 'Northern Mariana Islands' },
    { code: 'NO', dial: '+47', name: 'Norway' },
    { code: 'OM', dial: '+968', name: 'Oman' },
    { code: 'PK', dial: '+92', name: 'Pakistan' },
    { code: 'PW', dial: '+680', name: 'Palau' },
    { code: 'PS', dial: '+970', name: 'Palestine' },
    { code: 'PA', dial: '+507', name: 'Panama' },
    { code: 'PG', dial: '+675', name: 'Papua New Guinea' },
    { code: 'PY', dial: '+595', name: 'Paraguay' },
    { code: 'PE', dial: '+51', name: 'Peru' },
    { code: 'PH', dial: '+63', name: 'Philippines' },
    { code: 'PN', dial: '+64', name: 'Pitcairn' },
    { code: 'PL', dial: '+48', name: 'Poland' },
    { code: 'PT', dial: '+351', name: 'Portugal' },
    { code: 'PR', dial: '+1-787, 1-939', name: 'Puerto Rico' },
    { code: 'QA', dial: '+974', name: 'Qatar' },
    { code: 'CG', dial: '+242', name: 'Republic of the Congo' },
    { code: 'RE', dial: '+262', name: 'Reunion' },
    { code: 'RO', dial: '+40', name: 'Romania' },
    { code: 'RU', dial: '+7', name: 'Russia' },
    { code: 'RW', dial: '+250', name: 'Rwanda' },
    { code: 'BL', dial: '+590', name: 'Saint Barthelemy' },
    { code: 'SH', dial: '+290', name: 'Saint Helena' },
    { code: 'KN', dial: '+1-869', name: 'Saint Kitts and Nevis' },
    { code: 'LC', dial: '+1-758', name: 'Saint Lucia' },
    { code: 'MF', dial: '+590', name: 'Saint Martin' },
    { code: 'PM', dial: '+508', name: 'Saint Pierre and Miquelon' },
    { code: 'VC', dial: '+1-784', name: 'Saint Vincent and the Grenadines' },
    { code: 'WS', dial: '+685', name: 'Samoa' },
    { code: 'SM', dial: '+378', name: 'San Marino' },
    { code: 'ST', dial: '+239', name: 'Sao Tome and Principe' },
    { code: 'SA', dial: '+966', name: 'Saudi Arabia' },
    { code: 'SN', dial: '+221', name: 'Senegal' },
    { code: 'RS', dial: '+381', name: 'Serbia' },
    { code: 'SC', dial: '+248', name: 'Seychelles' },
    { code: 'SL', dial: '+232', name: 'Sierra Leone' },
    { code: 'SG', dial: '+65', name: 'Singapore' },
    { code: 'SX', dial: '+1-721', name: 'Sint Maarten' },
    { code: 'SK', dial: '+421', name: 'Slovakia' },
    { code: 'SI', dial: '+386', name: 'Slovenia' },
    { code: 'SB', dial: '+677', name: 'Solomon Islands' },
    { code: 'SO', dial: '+252', name: 'Somalia' },
    { code: 'ZA', dial: '+27', name: 'South Africa' },
    { code: 'KR', dial: '+82', name: 'South Korea' },
    { code: 'SS', dial: '+211', name: 'South Sudan' },
    { code: 'ES', dial: '+34', name: 'Spain' },
    { code: 'LK', dial: '+94', name: 'Sri Lanka' },
    { code: 'SD', dial: '+249', name: 'Sudan' },
    { code: 'SR', dial: '+597', name: 'Suriname' },
    { code: 'SJ', dial: '+47', name: 'Svalbard and Jan Mayen' },
    { code: 'SZ', dial: '+268', name: 'Swaziland' },
    { code: 'SE', dial: '+46', name: 'Sweden' },
    { code: 'CH', dial: '+41', name: 'Switzerland' },
    { code: 'SY', dial: '+963', name: 'Syria' },
    { code: 'TW', dial: '+886', name: 'Taiwan' },
    { code: 'TJ', dial: '+992', name: 'Tajikistan' },
    { code: 'TZ', dial: '+255', name: 'Tanzania' },
    { code: 'TH', dial: '+66', name: 'Thailand' },
    { code: 'TG', dial: '+228', name: 'Togo' },
    { code: 'TK', dial: '+690', name: 'Tokelau' },
    { code: 'TO', dial: '+676', name: 'Tonga' },
    { code: 'TT', dial: '+1-868', name: 'Trinidad and Tobago' },
    { code: 'TN', dial: '+216', name: 'Tunisia' },
    { code: 'TR', dial: '+90', name: 'Turkey' },
    { code: 'TM', dial: '+993', name: 'Turkmenistan' },
    { code: 'TC', dial: '+1-649', name: 'Turks and Caicos Islands' },
    { code: 'TV', dial: '+688', name: 'Tuvalu' },
    { code: 'VI', dial: '+1-340', name: 'U.S. Virgin Islands' },
    { code: 'UG', dial: '+256', name: 'Uganda' },
    { code: 'UA', dial: '+380', name: 'Ukraine' },
    { code: 'AE', dial: '+971', name: 'United Arab Emirates' },
    { code: 'GB', dial: '+44', name: 'United Kingdom' },
    { code: 'US', dial: '+1', name: 'United States' },
    { code: 'UY', dial: '+598', name: 'Uruguay' },
    { code: 'UZ', dial: '+998', name: 'Uzbekistan' },
    { code: 'VU', dial: '+678', name: 'Vanuatu' },
    { code: 'VA', dial: '+379', name: 'Vatican' },
    { code: 'VE', dial: '+58', name: 'Venezuela' },
    { code: 'VN', dial: '+84', name: 'Vietnam' },
    { code: 'WF', dial: '+681', name: 'Wallis and Futuna' },
    { code: 'EH', dial: '+212', name: 'Western Sahara' },
    { code: 'YE', dial: '+967', name: 'Yemen' },
    { code: 'ZM', dial: '+260', name: 'Zambia' },
    { code: 'ZW', dial: '+263', name: 'Zimbabwe' },
];

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' }>(
    ({ className = '', variant = 'primary', children, ...props }, ref) => {
        const baseStyles = "inline-flex items-center justify-center rounded-2xl text-sm font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";
        const variants = {
            primary: "bg-black text-white hover:bg-orange-600 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(234,88,12,0.24)] border-0",
            secondary: "bg-white text-black hover:bg-gray-50 shadow-sm border border-gray-100",
            outline: "border-2 border-white/20 bg-transparent text-white hover:bg-white/10 backdrop-blur-md",
            ghost: "hover:bg-white/10 text-white"
        };
        return (
            <button ref={ref} className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className = '', ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={`flex h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/30 backdrop-blur-xl focus:bg-white/10 focus:border-orange-500/50 focus:outline-none transition-all duration-300 ring-offset-black ${className}`}
                {...props}
            />
        );
    }
);
Input.displayName = "Input";

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
    ({ className = '', ...props }, ref) => (
        <label ref={ref} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props} />
    )
);
Label.displayName = "Label";

const MailIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
);
const LockIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
);
const UserIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
const EyeIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
);
const EyeOffIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
);
const Loader2Icon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className + " animate-spin"}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);
const PhoneIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
);
const KeyIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21 2-2 2" /><circle cx="10" cy="14" r="5" /><path d="M13 11l6 6" /><path d="m19 19 2 2" /></svg>
);

const LoginForm = React.memo(({
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    togglePasswordVisibility,
    handleSignIn,
    isSubmitting,
    onForgotPassword
}: any) => (
    <form onSubmit={handleSignIn} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-5">
            <div className="space-y-2">
                <Label htmlFor="email" className="text-white/70 font-bold text-[10px] uppercase tracking-widest pl-1">Email Address</Label>
                <div className="relative group">
                    <MailIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/20 h-5 w-5 transition-colors group-focus-within:text-orange-500" />
                    <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className="pl-12"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="password" className="text-white/70 font-bold text-[10px] uppercase tracking-widest pl-1">Security Password</Label>
                <div className="relative group">
                    <LockIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/20 h-5 w-5 transition-colors group-focus-within:text-orange-500" />
                    <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        minLength={8}
                        className="pl-12 pr-12"
                    />
                    <button
                        type="button"
                        className="absolute right-0 top-0 h-full px-4 py-2 hover:bg-transparent flex items-center justify-center transition-colors group text-white/20 hover:text-white"
                        onClick={togglePasswordVisibility}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? (
                            <EyeOffIcon className="h-5 w-5" />
                        ) : (
                            <EyeIcon className="h-5 w-5" />
                        )}
                    </button>
                </div>
            </div>
        </div>

        <div className="flex flex-col items-center gap-6 pt-4">
            <Button
                type="submit"
                className="w-full max-w-[280px] h-14"
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <>
                        <Loader2Icon className="mr-3 h-5 w-5" />
                        Processing...
                    </>
                ) : (
                    'Sign In to Account'
                )}
            </Button>

            <button
                type="button"
                onClick={onForgotPassword}
                className="text-white/40 hover:text-orange-400 text-[11px] font-black uppercase tracking-[0.2em] transition-colors duration-300"
            >
                Forgot password
            </button>
        </div>
    </form>
));

const ForgotPasswordForm = React.memo(({
    email,
    setEmail,
    handleForgotPassword,
    isSubmitting,
    onBack
}: any) => (
    <form onSubmit={handleForgotPassword} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-3">
            <h3 className="text-3xl font-black text-white tracking-tight">Recover Access</h3>
            <p className="text-white/40 text-sm font-medium">Enter your email to receive reset instructions.</p>
        </div>
        <div className="space-y-5">
            <div className="space-y-2">
                <Label htmlFor="forgotEmail" className="text-white/70 font-bold text-[10px] uppercase tracking-widest pl-1">Email Address</Label>
                <div className="relative group">
                    <MailIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/20 h-5 w-5 transition-colors group-focus-within:text-orange-500" />
                    <Input
                        id="forgotEmail"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-12"
                    />
                </div>
            </div>
        </div>

        <div className="flex flex-col items-center gap-6 pt-4">
            <Button
                type="submit"
                className="w-full max-w-[280px] h-14"
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <>
                        <Loader2Icon className="mr-3 h-5 w-5" />
                        Sending...
                    </>
                ) : (
                    'Resend email'
                )}
            </Button>
            <button
                type="button"
                onClick={onBack}
                className="text-white/40 hover:text-white text-[11px] font-black uppercase tracking-[0.2em] transition-colors"
            >
                Back to Login
            </button>
        </div>
    </form>
));

const PinSetupForm = React.memo(({
    pin,
    setPin,
    handleSetupPin,
    isSubmitting,
    onBack
}: any) => (
    <form onSubmit={handleSetupPin} className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="text-center space-y-3">
            <h3 className="text-3xl font-black text-white tracking-tight">Security PIN</h3>
            <p className="text-white/40 text-sm font-medium">Create a secure 4-digit PIN for transactions.</p>
        </div>
        <div className="space-y-4">
            <div className="relative group max-w-[240px] mx-auto">
                <KeyIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/20 h-5 w-5 transition-colors group-focus-within:text-orange-500" />
                <Input
                    id="setupPin"
                    type="password"
                    inputMode="numeric"
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    required
                    maxLength={4}
                    className="pl-12 text-center text-3xl tracking-[0.8em] font-black h-20"
                />
            </div>
        </div>
        <div className="flex flex-col items-center gap-6">
            <Button
                type="submit"
                className="w-full max-w-[280px] h-14"
                disabled={isSubmitting || pin.length !== 4}
            >
                {isSubmitting ? (
                    <>
                        <Loader2Icon className="mr-3 h-5 w-5" />
                        Securing...
                    </>
                ) : (
                    'Activate Account'
                )}
            </Button>
            <button
                type="button"
                onClick={onBack}
                className="text-white/40 hover:text-white text-[11px] font-black uppercase tracking-[0.2em] transition-colors"
            >
                Return to Login
            </button>
        </div>
    </form>
));

const PinEntryForm = React.memo(({
    pin,
    setPin,
    handleVerifyPin,
    isSubmitting,
    onBack
}: any) => (
    <form onSubmit={handleVerifyPin} className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="text-center space-y-3">
            <h3 className="text-3xl font-black text-white tracking-tight">Verify Identity</h3>
            <p className="text-white/40 text-sm font-medium">Enhanced 2nd-factor authentication required.</p>
        </div>
        <div className="space-y-4">
            <div className="relative group max-w-[240px] mx-auto">
                <KeyIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/20 h-5 w-5 transition-colors group-focus-within:text-orange-500" />
                <Input
                    id="loginPin"
                    type="password"
                    inputMode="numeric"
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    required
                    maxLength={4}
                    className="pl-12 text-center text-3xl tracking-[0.8em] font-black h-20"
                />
            </div>
        </div>
        <div className="flex flex-col items-center gap-6">
            <Button
                type="submit"
                className="w-full max-w-[280px] h-14"
                disabled={isSubmitting || pin.length !== 4}
            >
                {isSubmitting ? (
                    <>
                        <Loader2Icon className="mr-3 h-5 w-5" />
                        Verifying...
                    </>
                ) : (
                    'Confirm Identity'
                )}
            </Button>
            <button
                type="button"
                onClick={onBack}
                className="text-white/40 hover:text-white text-[11px] font-black uppercase tracking-[0.2em] transition-colors"
            >
                Authentication Help
            </button>
        </div>
    </form>
));

const RegisterForm = React.memo(({
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    phone,
    setPhone,
    password,
    setPassword,
    showPassword,
    handleSignUp,
    isSubmitting,
    countryCode,
    setCountryCode,
    pin,
    setPin
}: any) => (
    <form onSubmit={handleSignUp} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="firstName" className="text-white/70 font-bold text-[10px] uppercase tracking-widest pl-1">First Name</Label>
                <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/20 h-5 w-5 transition-colors group-focus-within:text-orange-500" />
                    <Input
                        id="firstName"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="pl-12"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="lastName" className="text-white/70 font-bold text-[10px] uppercase tracking-widest pl-1">Last Name</Label>
                <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/20 h-5 w-5 transition-colors group-focus-within:text-orange-500" />
                    <Input
                        id="lastName"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="pl-12"
                    />
                </div>
            </div>
        </div>

        <div className="space-y-2">
            <Label htmlFor="emailRegister" className="text-white/70 font-bold text-[10px] uppercase tracking-widest pl-1">Work Email</Label>
            <div className="relative group">
                <MailIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/20 h-5 w-5 transition-colors group-focus-within:text-orange-500" />
                <Input
                    id="emailRegister"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="pl-12"
                />
            </div>
        </div>

        <div className="space-y-2">
            <Label htmlFor="phone" className="text-white/70 font-bold text-[10px] uppercase tracking-widest pl-1">Contact Number</Label>
            <div className="flex gap-3">
                <div className="w-1/3 relative group">
                    <select
                        className="w-full h-14 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:bg-white/10 focus:border-orange-500 appearance-none transition-all duration-300 backdrop-blur-xl"
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                    >
                        {COUNTRY_CODES.map((country) => (
                            <option key={country.code} value={country.dial} className="text-black">
                                {country.code} {country.dial}
                            </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                        <CountryFlag
                            countryCode={COUNTRY_CODES.find(c => c.dial === countryCode)?.code || 'US'}
                            svg
                            style={{ width: '1.2em', height: '1.2em' }}
                        />
                    </div>
                </div>
                <div className="relative w-2/3 group">
                    <PhoneIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/20 h-5 w-5 transition-colors group-focus-within:text-orange-500" />
                    <Input
                        id="phone"
                        type="tel"
                        placeholder="000 000 0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="pl-12"
                    />
                </div>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="passwordRegister" className="text-white/70 font-bold text-[10px] uppercase tracking-widest pl-1">Security Key</Label>
                <div className="relative group">
                    <LockIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/20 h-5 w-5 transition-colors group-focus-within:text-orange-500" />
                    <Input
                        id="passwordRegister"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        minLength={8}
                        className="pl-12 pr-12"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="pinRegister" className="text-white/70 font-bold text-[10px] uppercase tracking-widest pl-1">Account PIN</Label>
                <div className="relative group">
                    <KeyIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/20 h-5 w-5 transition-colors group-focus-within:text-orange-500" />
                    <Input
                        id="pinRegister"
                        type="password"
                        inputMode="numeric"
                        placeholder="••••"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        required
                        maxLength={4}
                        className="pl-12 text-center tracking-[0.5em] font-black"
                    />
                </div>
            </div>
        </div>

        <div className="flex justify-center pt-4">
            <Button
                type="submit"
                className="w-full max-w-[280px] h-14"
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <>
                        <Loader2Icon className="mr-3 h-5 w-5" />
                        Initializing...
                    </>
                ) : (
                    'Signup'
                )}
            </Button>
        </div>
    </form>
));

export const SignInPage: React.FC<{ initialTab?: 'login' | 'register' }> = ({ initialTab = 'login' }) => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);

    // Pre-fill email and detect claimToken from URL (e.g. /signup?email=x&claimToken=y)
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const claimTokenFromUrl = searchParams.get('claimToken') || '';
    const emailFromUrl = searchParams.get('email') || '';

    const [email, setEmail] = useState(emailFromUrl);
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+1');
    const [pin, setPin] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [pinRequired, setPinRequired] = useState(false);
    const [isSettingUpPin, setIsSettingUpPin] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [partialToken, setPartialToken] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const togglePasswordVisibility = useCallback(() => {
        setShowPassword(prev => !prev);
    }, []);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const res = await api.post('/auth/login', { email, password });

            if (res.data.pinRequired) {
                setPinRequired(true);
                setPartialToken(res.data.partialToken);
                return;
            }

            if (res.data.setupPinRequired) {
                setIsSettingUpPin(true);
                setPartialToken(res.data.partialToken);
                return;
            }

            login(res.data.token, res.data.user);
            navigate('/dashboard');
        } catch (error: any) {
            setErrorMessage(error.response?.data?.error || 'Failed to sign in.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyPin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const res = await api.post('/auth/verify-pin', { partialToken, pin });
            login(res.data.token, res.data.user);
            navigate('/dashboard');
        } catch (error: any) {
            setErrorMessage(error.response?.data?.error || 'Invalid PIN.');
            setPin('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSetupPin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const res = await api.post('/auth/setup-pin', { partialToken, pin });
            login(res.data.token, res.data.user);
            navigate('/dashboard');
        } catch (error: any) {
            setErrorMessage(error.response?.data?.error || 'Failed to setup PIN.');
            setPin('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const fullPhoneNumber = `${countryCode}${phone.replace(/\D/g, '')}`;

            const res = await api.post('/auth/register', {
                email,
                password,
                firstName,
                lastName,
                phone: fullPhoneNumber,
                pin
            });

            const credited = res.data.creditedPayments || 0;
            if (credited > 0) {
                setSuccessMessage(`Account created! ${credited} pending payment${credited > 1 ? 's have' : ' has'} been credited to your wallet.`);
            } else {
                setSuccessMessage('Account created! Redirecting to login...');
            }
            setActiveTab('login');
        } catch (error: any) {
            setErrorMessage(error.response?.data?.error || 'Failed to sign up.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            const res = await api.post('/auth/forgot-password', { email });
            setSuccessMessage(res.data.message);
        } catch (error: any) {
            setErrorMessage(error.response?.data?.error || 'Failed to send recovery email.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex relative overflow-hidden font-sans selection:bg-orange-500/30">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-orange-600/5 rounded-full blur-[100px]"></div>

            <style>{`
        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(2deg); }
        }
        .animate-float {
            animation: float 6s ease-in-out infinite;
        }
      `}</style>

            <button
                onClick={() => navigate('/')}
                className="absolute top-10 left-10 z-50 flex items-center gap-3 text-white/40 hover:text-white font-black text-[10px] uppercase tracking-[0.3em] transition-all group"
            >
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Home</span>
            </button>

            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 z-20">
                <div className="w-full max-w-lg">
                    <div className="mb-14 text-center">
                        <div className="inline-block mb-6 relative group">
                            <h1 className="text-6xl font-black mb-3 tracking-tighter flex items-center justify-center">
                                <span className="text-white">Flapa</span>
                                <span className="text-orange-600">Pay</span>
                            </h1>
                            <div className="h-0.5 w-0 group-hover:w-full bg-orange-600 transition-all duration-700 mx-auto"></div>
                            <p className="mt-4 text-white/30 text-[10px] font-black uppercase tracking-[0.4em]">
                                The Unified Financial Operating Technology
                            </p>
                        </div>
                    </div>

                    <div className="backdrop-blur-[100px] bg-white/[0.02] border border-white/[0.05] shadow-[0_48px_100px_-12px_rgba(0,0,0,0.5)] rounded-[48px] overflow-hidden transition-all duration-700 hover:bg-white/[0.04] p-12">
                        {errorMessage && (
                            <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-md rounded-2xl p-4 mb-10 text-red-500 text-[11px] font-black uppercase tracking-widest text-center animate-in fade-in slide-in-from-top-2 duration-500">
                                {errorMessage}
                            </div>
                        )}

                        {successMessage && (
                            <div className="bg-green-500/10 border border-green-500/20 backdrop-blur-md rounded-2xl p-4 mb-10 text-green-500 text-[11px] font-black uppercase tracking-widest text-center animate-in fade-in slide-in-from-top-2 duration-500">
                                {successMessage}
                            </div>
                        )}

                        {!isSettingUpPin && !pinRequired && (
                            <>
                                <button
                                    disabled={isSubmitting}
                                    className="w-full bg-white text-black rounded-2xl h-16 font-black text-sm mb-10 transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center group shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:shadow-[0_20px_40px_rgba(255,255,255,0.2)]"
                                >
                                    <svg className="w-5 h-5 mr-4" viewBox="0 0 48 48">
                                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.13-.45-4.63H24v9.06h12.94c-.58 2.86-2.22 5.27-4.56 6.96l7.14 5.53c4.17-3.84 6.46-9.5 6.46-16.92z" />
                                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z" />
                                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.14-5.53c-2.1 1.41-4.76 2.19-7.7 2.19-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                                        <path fill="none" d="M0 0h48v48H0z" />
                                    </svg>
                                    <span className="uppercase tracking-[0.15em] font-black text-[11px]">Continue with Google</span>
                                </button>

                                <div className="relative mb-10">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-white/[0.05]" />
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-[#0A0A0A] px-6 text-white/20 text-[10px] font-black uppercase tracking-[0.2em]">
                                            Login by Email
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}

                        {isSettingUpPin ? (
                            <PinSetupForm
                                pin={pin}
                                setPin={setPin}
                                handleSetupPin={handleSetupPin}
                                isSubmitting={isSubmitting}
                                onBack={() => {
                                    setIsSettingUpPin(false);
                                    setPin('');
                                }}
                            />
                        ) : pinRequired ? (
                            <PinEntryForm
                                pin={pin}
                                setPin={setPin}
                                handleVerifyPin={handleVerifyPin}
                                isSubmitting={isSubmitting}
                                onBack={() => {
                                    setPinRequired(false);
                                    setPin('');
                                }}
                            />
                        ) : (
                            <>
                                <div className="grid w-full grid-cols-2 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[20px] mb-12 p-1.5 shadow-inner">
                                    <button
                                        onClick={() => {
                                            setActiveTab('login');
                                            setIsForgotPassword(false);
                                        }}
                                        className={`py-4 text-[10px] font-black rounded-[15px] transition-all duration-500 uppercase tracking-[0.2em] ${activeTab === 'login' ? 'bg-white text-black shadow-2xl scale-[1.02]' : 'text-white/20 hover:text-white'}`}
                                    >
                                        Login
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActiveTab('register');
                                            setIsForgotPassword(false);
                                        }}
                                        className={`py-4 text-[10px] font-black rounded-[15px] transition-all duration-500 uppercase tracking-[0.2em] ${activeTab === 'register' ? 'bg-white text-black shadow-2xl scale-[1.02]' : 'text-white/20 hover:text-white'}`}
                                    >
                                        Signup
                                    </button>
                                </div>

                                {isForgotPassword ? (
                                    <ForgotPasswordForm
                                        email={email}
                                        setEmail={setEmail}
                                        handleForgotPassword={handleForgotPassword}
                                        isSubmitting={isSubmitting}
                                        onBack={() => setIsForgotPassword(false)}
                                    />
                                ) : activeTab === 'login' ? (
                                    <LoginForm
                                        email={email}
                                        setEmail={setEmail}
                                        password={password}
                                        setPassword={setPassword}
                                        showPassword={showPassword}
                                        togglePasswordVisibility={togglePasswordVisibility}
                                        handleSignIn={handleSignIn}
                                        isSubmitting={isSubmitting}
                                        onForgotPassword={() => setIsForgotPassword(true)}
                                    />
                                ) : (
                                    <>
                                        {claimTokenFromUrl && (
                                            <div className="bg-orange-500/15 border border-orange-500/30 backdrop-blur-md rounded-2xl p-4 mb-6 flex items-start gap-3">
                                                <span className="text-orange-400 text-lg mt-0.5">💰</span>
                                                <div>
                                                    <p className="text-orange-400 text-[11px] font-black uppercase tracking-widest mb-1">Funds Waiting For You</p>
                                                    <p className="text-white/70 text-xs font-bold">Create your account to automatically claim your pending payment.</p>
                                                </div>
                                            </div>
                                        )}
                                        <RegisterForm
                                            firstName={firstName}
                                            setFirstName={setFirstName}
                                            lastName={lastName}
                                            setLastName={setLastName}
                                            email={email}
                                            setEmail={setEmail}
                                            phone={phone}
                                            setPhone={setPhone}
                                            countryCode={countryCode}
                                            setCountryCode={setCountryCode}
                                            password={password}
                                            setPassword={setPassword}
                                            showPassword={showPassword}
                                            togglePasswordVisibility={togglePasswordVisibility}
                                            handleSignUp={handleSignUp}
                                            isSubmitting={isSubmitting}
                                            pin={pin}
                                            setPin={setPin}
                                        />
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black">
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-black/40 to-[#050505] z-10"></div>
                <div className="absolute inset-0 bg-[#050505]/20 mix-blend-overlay z-15"></div>

                <div className="absolute top-20 right-20 z-20 animate-float">
                    <div className="backdrop-blur-2xl bg-white/[0.03] border border-white/[0.1] p-8 rounded-[32px] shadow-2xl">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-orange-600/20 flex items-center justify-center">
                                <div className="w-6 h-6 rounded-full bg-orange-600 animate-pulse"></div>
                            </div>
                            <div>
                                <p className="text-white font-black text-xs uppercase tracking-widest">Global Status</p>
                                <p className="text-orange-500 text-[10px] font-bold">Encrypted & Operational</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-1 w-32 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full w-2/3 bg-white/20"></div>
                            </div>
                            <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full w-1/2 bg-white/20"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <img
                    src="/assets/images/login.jpg"
                    alt="Elite Fintech Operating System"
                    className="w-full h-full object-cover transform scale-110 opacity-60"
                />
            </div>
        </div>
    );
};

export default SignInPage;
