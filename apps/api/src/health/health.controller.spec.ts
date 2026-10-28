import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  beforeEach(() => {
    service = new HealthService();
    controller = new HealthController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health check result', () => {
    const result = controller.check();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('lernivox-api');
    expect(result.version).toBe('0.1.0');
    expect(typeof result.uptimeSeconds).toBe('number');
    expect(typeof result.timestamp).toBe('string');
  });
});
