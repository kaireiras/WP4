# Antigravity Workspace Guidelines

## Figma Integration Workflow

- Ketika user memberikan tautan Figma atau meminta membaca desain Figma:
  1. Jangan menanyakan token atau meminta izin akses ke user secara manual.
  2. Gunakan Environment Variable `$FIGMA_ACCESS_TOKEN` yang sudah tersimpan di shell (`~/.bashrc`).
  3. Ekstrak `file_key` dan `node-id` dari URL Figma (ubah format node ID dari tanda minus `-` menjadi titik dua `:`, misal `1-4938` menjadi `1:4938`).
  4. Panggil langsung Figma REST API via terminal menggunakan header `X-Figma-Token: $FIGMA_ACCESS_TOKEN`:
     - Detail node & path geometri: `https://api.figma.com/v1/files/<file_key>/nodes?ids=<node_id>&geometry=paths`
     - Render gambar/SVG: `https://api.figma.com/v1/images/<file_key>?ids=<node_id>&format=png`
  5. Buat kode HTML, CSS, atau aset SVG secara presisi sesuai dengan data desain yang didapatkan dari API.

## Post-Changes Workflows & Verifikasi Kode

- Setiap kali ada penambahan atau perubahan berkas/kode oleh AI:
  1. Jalankan `pnpm fix` (misal `pnpm --prefix Frontend fix`) untuk memformat kode secara otomatis dan menerapkan auto-fix linting ESLint & Prettier agar kode rapi.
  2. Jalankan `tsc` (misal `pnpm --prefix Frontend exec tsc --noEmit`) untuk memastikan tidak ada error tipe data TypeScript.
  3. Pastikan seluruh berkas yang dimodifikasi dalam kondisi bersih tanpa error sebelum mengakhiri respons kepada user.
