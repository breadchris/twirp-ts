import { File } from "../file";
export function genIndexFile(registry, files) {
    const fileToExport = registry.allFiles()
        .filter((fileDescriptor) => {
        let hasExports = false;
        registry.visitTypes(fileDescriptor, descriptor => {
            // we are not interested in synthetic types like map entry messages
            if (registry.isSyntheticElement(descriptor))
                return;
            hasExports = true;
        });
        return hasExports;
    })
        .map((file => { var _a; return (_a = file.name) === null || _a === void 0 ? void 0 : _a.replace(".proto", ""); }));
    const compiledFiles = files.filter(file => file.getContent() !== "").map(file => {
        return file.fileName.replace(".ts", "");
    });
    if (compiledFiles.length > 0) {
        fileToExport.push(...compiledFiles);
    }
    const indexFile = new File('index.ts');
    return indexFile.setContent(fileToExport.map((fileName) => {
        return `export * from "./${fileName}";`;
    }).join("\n"));
}
