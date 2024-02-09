export interface Metadata {
    name: string;
    labels?: {
        [key: string]: string;
    } | null;
    annotations?: {
        [key: string]: string;
    } | null;
    version?: number | null;
    creationTimestamp?: string | null;
    deletionTimestamp?: string | null;
}

export interface LucencePlugin {
    detail: LucencePluginDetail;
    apiVersion: "lucence.plugin.halo.run/v1alpha1";
    kind: "LucencePlugin";
    metadata: Metadata;
}

export interface LucencePluginDetail {
    name: string,
    source: string;
    enable?: boolean;
}

export interface LucencePluginList {
    page: number;
    size: number;
    total: number;
    items: Array<LucencePlugin>;
    first: boolean;
    last: boolean;
    hasNext: boolean;
    hasPrevious: boolean;
    totalPages: number;
}
