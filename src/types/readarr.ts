// Readarr API Response Types

export interface ReadarrBook {
  id: number;
  title: string;
  authorTitle?: string;
  seriesTitle?: string;
  disambiguation?: string;
  overview?: string;
  images: ReadarrImage[];
  links: ReadarrLink[];
  statistics?: BookStatistics;
  genres?: string[];
  ratings?: Rating;
  releaseDate?: string;
  pageCount?: number;
  added?: string;
  addOptions?: AddOptions;
  remoteCover?: string;
  editions?: Edition[];
  grabbed?: boolean;
  author?: Author;
  authorId?: number;
  monitored?: boolean;
  anyEditionOk?: boolean;
  qualityProfileId?: number;
  titleSlug?: string;
  rootFolderPath?: string;
  foreignBookId?: string;
  foreignEditionId?: string;
}

export interface Author {
  id: number;
  authorName: string;
  authorNameLastFirst?: string;
  foreignAuthorId?: string;
  titleSlug?: string;
  overview?: string;
  links?: ReadarrLink[];
  images?: ReadarrImage[];
  path?: string;
  qualityProfileId?: number;
  metadataProfileId?: number;
  genres?: string[];
  cleanName?: string;
  sortName?: string;
  sortNameLastFirst?: string;
  tags?: number[];
  added?: string;
  ratings?: Rating;
  statistics?: AuthorStatistics;
  monitored?: boolean;
  monitorNewItems?: string;
}

export interface AuthorStatistics {
  bookCount?: number;
  bookFileCount?: number;
  totalBookCount?: number;
  sizeOnDisk?: number;
  percentOfBooks?: number;
}

export interface BookStatistics {
  bookFileCount: number;
  bookCount: number;
  totalBookCount?: number;
  sizeOnDisk: number;
  percentOfBooks?: number;
}

export interface ReadarrImage {
  url: string;
  coverType: "poster" | "cover" | "banner" | "fanart" | "screenshot" | "headshot" | "clearlogo";
  extension?: string;
  remoteUrl?: string;
}

export interface ReadarrLink {
  url: string;
  name: string;
}

export interface Rating {
  votes: number;
  value: number;
  popularity?: number;
}

export interface AddOptions {
  monitor?: string;
  searchForNewBook?: boolean;
  addType?: string;
}

export interface Edition {
  id: number;
  bookId: number;
  foreignEditionId: string;
  titleSlug?: string;
  isbn13?: string;
  asin?: string;
  title: string;
  overview?: string;
  format?: string;
  isEbook?: boolean;
  publisher?: string;
  pageCount?: number;
  releaseDate?: string;
  images?: ReadarrImage[];
  links?: ReadarrLink[];
  ratings?: Rating;
  monitored: boolean;
  manualAdd?: boolean;
  grabbed?: boolean;
}

export interface QualityProfile {
  id: number;
  name: string;
  upgradeAllowed: boolean;
  cutoff: number;
  items: QualityProfileItem[];
}

export interface QualityProfileItem {
  quality?: Quality;
  items?: QualityProfileItem[];
  allowed: boolean;
}

export interface Quality {
  id: number;
  name: string;
}

export interface RootFolder {
  id: number;
  path: string;
  accessible: boolean;
  freeSpace: number;
  totalSpace: number;
  unmappedFolders?: UnmappedFolder[];
}

export interface UnmappedFolder {
  name: string;
  path: string;
}

export interface BookFile {
  id: number;
  authorId: number;
  bookId: number;
  path: string;
  size: number;
  dateAdded: string;
  quality: QualityModel;
  qualityWeight?: number;
  mediaInfo?: MediaInfo;
  editionId: number;
  calibreId?: number;
  part?: number;
  author?: Author;
  book?: ReadarrBook;
  edition?: Edition;
}

export interface QualityModel {
  quality: Quality;
  revision: Revision;
}

export interface Revision {
  version: number;
  real: number;
  isRepack?: boolean;
}

export interface MediaInfo {
  audioFormat?: string;
  audioBitrate?: number;
  audioChannels?: number;
  audioBits?: number;
  audioSampleRate?: number;
}

export interface BookAddPayload {
  title: string;
  foreignBookId?: string;
  titleSlug?: string;
  author?: Author;
  editions?: Edition[];
  monitored: boolean;
  addOptions: {
    searchForNewBook: boolean;
  };
  qualityProfileId: number;
  metadataProfileId?: number;
  rootFolderPath: string;
  tags?: number[];
}

export interface SystemStatus {
  version: string;
  buildTime: string;
  isDebug: boolean;
  isProduction: boolean;
  isAdmin: boolean;
  isUserInteractive: boolean;
  startupPath: string;
  appData: string;
  osName: string;
  osVersion: string;
  isMonoRuntime: boolean;
  isMono: boolean;
  isLinux: boolean;
  isOsx: boolean;
  isWindows: boolean;
  mode: string;
  branch: string;
  authentication: string;
  sqliteVersion: string;
  urlBase: string;
  runtimeVersion: string;
  runtimeName: string;
}
