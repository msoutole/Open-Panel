declare module 'tar-fs' {
    import { Readable } from 'stream'

    interface PackOptions {
        ignore?: (name: string) => boolean
        entries?: string[]
        map?: (header: any) => any
        mapStream?: (fileStream: Readable, header: any) => Readable
    }

    export function pack(cwd: string, options?: PackOptions): Readable
    export function extract(cwd: string, options?: any): any
}
