/**
 * Tipos auxiliares para testes
 * Fornece mocks e types seguros para testes de integração
 */

import type { ContainerInspectInfo } from 'dockerode';
import type { UserRole } from '@prisma/client';

/**
 * Mock completo de ContainerInspectInfo para testes
 */
export const createMockContainerInspectInfo = (overrides?: Partial<ContainerInspectInfo>): ContainerInspectInfo => {
  return {
    Id: 'mock-container-id',
    Created: new Date().toISOString(),
    Path: '/bin/sh',
    Args: [],
    State: {
      Status: 'running',
      Running: true,
      Paused: false,
      Restarting: false,
      OOMKilled: false,
      Dead: false,
      Pid: 12345,
      ExitCode: 0,
      Error: '',
      StartedAt: new Date().toISOString(),
      FinishedAt: '',
    },
    Image: 'sha256:mock-image-id',
    ResolvConfPath: '/var/lib/docker/containers/mock/resolv.conf',
    HostnamePath: '/var/lib/docker/containers/mock/hostname',
    HostsPath: '/var/lib/docker/containers/mock/hosts',
    LogPath: '/var/lib/docker/containers/mock/mock-json.log',
    Name: '/mock-container',
    RestartCount: 0,
    Driver: 'overlay2',
    Platform: 'linux',
    MountLabel: '',
    ProcessLabel: '',
    AppArmorProfile: '',
    ExecIDs: null,
    HostConfig: {
      Binds: [],
      ContainerIDFile: '',
      LogConfig: {
        Type: 'json-file',
        Config: {},
      },
      NetworkMode: 'bridge',
      PortBindings: {},
      RestartPolicy: {
        Name: 'no',
        MaximumRetryCount: 0,
      },
      AutoRemove: false,
      VolumeDriver: '',
      VolumesFrom: [],
      CapAdd: [],
      CapDrop: [],
      Dns: [],
      DnsOptions: [],
      DnsSearch: [],
      ExtraHosts: [],
      GroupAdd: [],
      IpcMode: '',
      Cgroup: '',
      Links: [],
      OomScoreAdj: 0,
      PidMode: '',
      Privileged: false,
      PublishAllPorts: false,
      ReadonlyRootfs: false,
      SecurityOpt: [],
      UTSMode: '',
      UsernsMode: '',
      ShmSize: 67108864,
      Runtime: 'runc',
      ConsoleSize: [0, 0],
      Isolation: '',
      CpuShares: 0,
      Memory: 0,
      NanoCpus: 0,
      CgroupParent: '',
      BlkioWeight: 0,
      BlkioWeightDevice: [],
      BlkioDeviceReadBps: [],
      BlkioDeviceWriteBps: [],
      BlkioDeviceReadIOps: [],
      BlkioDeviceWriteIOps: [],
      CpuPeriod: 0,
      CpuQuota: 0,
      CpuRealtimePeriod: 0,
      CpuRealtimeRuntime: 0,
      CpusetCpus: '',
      CpusetMems: '',
      Devices: [],
      DeviceCgroupRules: [],
      DiskQuota: 0,
      KernelMemory: 0,
      MemoryReservation: 0,
      MemorySwap: 0,
      MemorySwappiness: -1,
      OomKillDisable: false,
      PidsLimit: 0,
      Ulimits: [],
      CpuCount: 0,
      CpuPercent: 0,
      IOMaximumIOps: 0,
      IOMaximumBandwidth: 0,
    },
    GraphDriver: {
      Name: 'overlay2',
      Data: {
        LowerDir: '',
        MergedDir: '',
        UpperDir: '',
        WorkDir: '',
      },
    },
    Mounts: [],
    Config: {
      Hostname: 'mock-hostname',
      Domainname: '',
      User: '',
      AttachStdin: false,
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
      OpenStdin: false,
      StdinOnce: false,
      Env: [],
      Cmd: [],
      Image: 'mock-image:latest',
      Volumes: null,
      WorkingDir: '',
      Entrypoint: null,
      OnBuild: null,
      Labels: {},
    },
    NetworkSettings: {
      Bridge: '',
      SandboxID: '',
      HairpinMode: false,
      LinkLocalIPv6Address: '',
      LinkLocalIPv6PrefixLen: 0,
      Ports: {},
      SandboxKey: '',
      SecondaryIPAddresses: [],
      SecondaryIPv6Addresses: [],
      EndpointID: '',
      Gateway: '',
      GlobalIPv6Address: '',
      GlobalIPv6PrefixLen: 0,
      IPAddress: '',
      IPPrefixLen: 0,
      IPv6Gateway: '',
      MacAddress: '',
      Networks: {},
    },
    ...overrides,
  } as ContainerInspectInfo;
};

/**
 * Mock de resposta de sucesso para testes
 */
export interface MockSuccessResponse {
  success: true;
}

/**
 * Mock de JWT Payload para testes
 */
export interface MockJWTPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Type guard para verificar se um objeto é uma resposta de API válida
 */
export function isApiResponse(obj: unknown): obj is { success: boolean; data?: any; error?: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'success' in obj &&
    typeof (obj as any).success === 'boolean'
  );
}

/**
 * Type guard para verificar se um objeto tem propriedade data
 */
export function hasData<T>(obj: unknown): obj is { data: T } {
  return typeof obj === 'object' && obj !== null && 'data' in obj;
}

/**
 * Type guard para verificar se um objeto tem token
 */
export function hasToken(obj: unknown): obj is { token: string; refreshToken: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'token' in obj &&
    'refreshToken' in obj &&
    typeof (obj as any).token === 'string' &&
    typeof (obj as any).refreshToken === 'string'
  );
}
