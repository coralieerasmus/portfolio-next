// Shrinks the .glb files in public/models (simplifies meshes, compresses
// geometry with meshopt and textures to webp). Run once: npm run optimize
import { execSync } from 'node:child_process'
import { readdirSync, renameSync, statSync } from 'node:fs'
import { join } from 'node:path'

const dir = 'public/models'
for (const file of readdirSync(dir).filter((f) => f.endsWith('.glb'))) {
  const src = join(dir, file)
  const tmp = join(dir, `${file}.tmp.glb`)
  const before = statSync(src).size
  execSync(`npx gltf-transform optimize "${src}" "${tmp}" --texture-compress webp --texture-size 1024`, {
    stdio: 'inherit',
  })
  renameSync(tmp, src)
  const after = statSync(src).size
  console.log(`${file}: ${(before / 1e6).toFixed(1)} MB -> ${(after / 1e6).toFixed(1)} MB`)
}
