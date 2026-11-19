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

## Comment Rules

- Komentar hanya menyertakan deskripsi ringkas dari bagian yang ada, misalnya kegunaan fungsi (function) atau bagian tata letak UI/HTML (seperti bagian kiri, header, dsb.). Hindari komentar redundan atau penjelasan yang tidak perlu.

## Arsitektur Integrasi API & State Management

- Seluruh pemanggilan API backend (Laravel) wajib ditempatkan di dalam folder `Frontend/src/services/` dan dibungkus menggunakan `createServerFn` dari `@tanstack/react-start` serta Axios (`api.ts`).
- Di tingkat halaman/komponen, gunakan TanStack Query (`useQuery`, `useMutation`) langsung di dalam komponen halaman tanpa blocking `loader` di TanStack Router, dengan loading stage berupa Skeleton (mengikuti arsitektur Fe-Voting agar perpindahan halaman instan tanpa freeze/delay).
- Selalu sesuaikan key mapping di frontend dengan struktur response aktual API backend (dapat diverifikasi menggunakan `curl`).

## Filter Rentang Waktu (Time Range)

- Default preset rentang waktu untuk dashboard, alert, dan grafik selalu `'today'`.
- Opsi preset rentang waktu `ALL` (Semua Waktu) tidak digunakan / dihapus.
