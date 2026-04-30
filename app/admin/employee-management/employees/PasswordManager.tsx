import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Check, Lock, RefreshCw, Save, X } from 'lucide-react';


interface PasswordManagerProps {
    selectedEmployee: any;
    onSave?: (newPassword: string) => void;
    isLoading: boolean;
}

const PasswordManager: React.FC<PasswordManagerProps> = ({ selectedEmployee, onSave, isLoading = false }) => {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [password, setPassword] = useState<string>(selectedEmployee.password || "");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);

    // Generate random password (Length 7-8)
    const generatePassword = (): void => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        const length = Math.floor(Math.random() * 2) + 7; // Result is 7 or 8
        let retVal = "";
        for (let i = 0; i < length; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        setPassword(retVal);
        setShowPassword(true); // Reveal generated password to user
    };

    const handleCopy = async (): Promise<void> => {
        if (!password) return;
        try {
            await navigator.clipboard.writeText(password);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy!", err);
        }
    };

    const handleSave = (): void => {
        if (onSave) onSave(password);
        setIsEditing(false);
    };

    const handleCancel = (): void => {
        setPassword(selectedEmployee.password || "");
        setIsEditing(false);
    };

    return (
        <div className="w-full max-w-md p-4 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 hidden">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <Lock className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-tight">
                        Credentials
                    </h3>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 ml-1">PASSWORD</label>

                <div className="relative flex items-center">
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        readOnly={!isEditing}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        placeholder="No password set"
                        className={`w-full px-4 py-3 pr-12 rounded-xl font-mono text-sm transition-all outline-none border
              ${isEditing
                                ? "bg-white border-blue-500 ring-4 ring-blue-50 text-gray-800"
                                : "bg-gray-50 border-transparent text-gray-600 cursor-default"
                            }`}
                    />

                    <div className="absolute right-2 flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="p-2 text-gray-400 hover:text-gray-600 transition"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>
                <div className='mt-1 pl-1'>
                    {isEditing && (
                        <button
                            type="button"
                            onClick={generatePassword}
                            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition active:scale-95"
                        >
                            <RefreshCw size={14} /> Generate
                        </button>
                    )}
                </div>
            </div>

            <div className="mt-6 flex gap-2">
                {isEditing ? (
                    <>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold transition"
                        >
                            <X size={18} /> Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold transition shadow-lg shadow-blue-100"
                        >
                            {isLoading ? "Saving..." : "Save"}
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold transition"
                            aria-label="Copy password"
                        >
                            {copied ? (<>
                                <Check size={18} className="text-green-500" />  Copied</>) : (
                                <><Copy size={18} /> Copy Password</>)}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white py-2.5 rounded-xl font-semibold transition"
                        >
                            Edit Password
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default PasswordManager;