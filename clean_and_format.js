import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_DIRS = ['SERVER', 'CLIENT'];
const EXTN_TO_CLEAN = ['.js', '.jsx', '.css', '.html'];
const IGNORE_DIRS = ['node_modules', 'dist', 'build', '.git'];

function removeComments(code, ext) {
    if (ext === '.html') {
        // Thay thế HTML comments, cẩn thận không xóa các IE conditionals nếu có, 
        // nhưng ở dự án này thường là comment HTML thường.
        return code.replace(/<!--[\s\S]*?-->/g, '');
    }
    
    let out = '';
    let i = 0;
    let inString = false;
    let stringChar = '';
    let inSingleComment = false;
    let inMultiComment = false;
    
    while (i < code.length) {
        let char = code[i];
        let nextChar = code[i + 1] || '';
        
        if (inSingleComment) {
            if (char === '\n') {
                inSingleComment = false;
                out += char; // Giữ lại newline
            }
            i++;
            continue;
        }
        
        if (inMultiComment) {
            if (char === '*' && nextChar === '/') {
                inMultiComment = false;
                i += 2;
            } else {
                if (char === '\n') out += char; // Giữ lại newline để không làm loạn dòng
                i++;
            }
            continue;
        }
        
        if (inString) {
            out += char;
            if (char === '\\') {
                out += nextChar;
                i += 2;
                continue;
            }
            if (char === stringChar) {
                inString = false;
            }
            i++;
            continue;
        }

        // Xử lý escape (giúp tránh lỗi khi gặp \/\/ trong regex)
        if (char === '\\') {
            out += char + nextChar;
            i += 2;
            continue;
        }
        
        // Bắt đầu chuỗi
        if (char === '"' || char === "'" || char === '`') {
            inString = true;
            stringChar = char;
            out += char;
            i++;
            continue;
        }
        
        // Bắt đầu comment
        if (char === '/' && nextChar === '/') {
            inSingleComment = true;
            i += 2;
            continue;
        }
        
        if (char === '/' && nextChar === '*') {
            inMultiComment = true;
            i += 2;
            continue;
        }
        
        out += char;
        i++;
    }
    
    // Dọn các dòng trống thừa sinh ra do xóa comment
    return out.replace(/^\s*[\r\n]/gm, '\n').replace(/\n{3,}/g, '\n\n');
}

function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        if (IGNORE_DIRS.includes(file)) continue;
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (stat.isFile()) {
            const ext = path.extname(fullPath);
            if (EXTN_TO_CLEAN.includes(ext)) {
                const original = fs.readFileSync(fullPath, 'utf-8');
                const cleaned = removeComments(original, ext);
                if (original !== cleaned) {
                    fs.writeFileSync(fullPath, cleaned, 'utf-8');
                    console.log(`[CLEANED] ${fullPath.replace(__dirname, '')}`);
                }
            }
        }
    }
}

console.log("=====================================");
console.log("🚀 Bắt đầu dọn dẹp toàn bộ comments...");
console.log("=====================================");
TARGET_DIRS.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (fs.existsSync(fullPath)) {
        processDirectory(fullPath);
    }
});
console.log("✅ Dọn dẹp comment hoàn tất!\n");

console.log("=====================================");
console.log("✨ Đang chạy Prettier Code Formatter...");
console.log("=====================================");
try {
    console.log("Formatting CLIENT...");
    execSync('npx prettier --write .', { cwd: path.join(__dirname, 'CLIENT'), stdio: 'inherit' });
    
    console.log("Formatting SERVER...");
    execSync('npx prettier --write .', { cwd: path.join(__dirname, 'SERVER'), stdio: 'inherit' });
    
    console.log("✅ Prettier formatting hoàn tất!");
} catch (e) {
    console.error("❌ Lỗi khi chạy Prettier. Vui lòng đảm bảo bạn có cài đặt npx và prettier.", e.message);
}

console.log("\n🎉 HOÀN THÀNH TẤT CẢ YÊU CẦU!");
