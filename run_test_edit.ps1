$html = @"
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<div id="res">PENDING</div>
<iframe id="f" src="http://localhost:8080/slide.html" style="width:1000px;height:800px;"></iframe>
<script>
window.addEventListener('load', () => {
    setTimeout(() => {
        try {
            const cw = document.getElementById('f').contentWindow;
            const doc = cw.document;
            
            // 1. Check functions
            const hasToggle = typeof cw.toggleEditMode === 'function';
            const hasSave = typeof cw.saveSlideEdits === 'function';
            const hasDownload = typeof cw.downloadEditedHTML === 'function';
            
            // 2. Call toggleEditMode(true)
            cw.toggleEditMode(true);
            const isEditOn = doc.body.classList.contains('edit-mode-on');
            const editableCount = doc.querySelectorAll('.editable-target').length;
            
            // 3. Edit title
            const title = doc.querySelector('#slide-1 .cover-title');
            if (title) title.innerText = "TIÊU ĐỀ ĐÃ SỬA THÀNH CÔNG";
            cw.saveSlideEdits(false);
            
            // 4. Check localStorage
            const saved = cw.localStorage.getItem('DATAMIND_SLIDE_SAVED_CONTENT_V2');
            const hasSavedData = saved && saved.includes('TIÊU ĐỀ ĐÃ SỬA THÀNH CÔNG');
            
            document.getElementById('res').innerText = JSON.stringify({
                hasToggle: hasToggle,
                hasSave: hasSave,
                hasDownload: hasDownload,
                isEditOn: isEditOn,
                editableCount: editableCount,
                hasSavedData: !!hasSavedData
            });
        } catch(e) {
            document.getElementById('res').innerText = 'ERROR: ' + e.message;
        }
    }, 2000);
});
</script>
</body>
</html>
"@
$html | Set-Content "c:\Users\Admin\Downloads\abc\test_edit_slide.html" -Encoding UTF8

$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$p = Start-Process -FilePath $edge -ArgumentList "--headless=new", "--disable-gpu", "--dump-dom", "http://localhost:8080/test_edit_slide.html" -NoNewWindow -PassThru -RedirectStandardOutput "c:\Users\Admin\Downloads\abc\test_edit_out.txt"
$p.WaitForExit(5000)
Get-Content "c:\Users\Admin\Downloads\abc\test_edit_out.txt" | Select-String -Pattern '\{"hasToggle".*\}'
Remove-Item "c:\Users\Admin\Downloads\abc\test_edit_slide.html", "c:\Users\Admin\Downloads\abc\test_edit_out.txt" -ErrorAction SilentlyContinue
