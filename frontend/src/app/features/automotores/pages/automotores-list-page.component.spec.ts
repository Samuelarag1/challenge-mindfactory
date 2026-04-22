import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiErrorService } from '../../../core/services/api-error.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { VehiclesService } from '../services/automotores.service';
import { VehiclesListPageComponent } from './automotores-list-page.component';

describe('VehiclesListPageComponent', () => {
  it('renders the basic vehicles listing', async () => {
    const vehiclesService = {
      list: vi.fn().mockReturnValue(
        of({
          items: [
            {
              licensePlate: 'AAA123',
              chassis: '8AFZZZ54ZMJ123456',
              engine: 'ABC123456',
              color: 'Rojo',
              manufactureDate: '2018-06-01',
              owner: {
                cuit: '20123456786',
                name: 'Juan Perez',
              },
            },
          ],
          meta: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
            search: null,
            sortBy: 'dominio',
            sortDirection: 'asc',
          },
        }),
      ),
      remove: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [VehiclesListPageComponent],
      providers: [
        provideNoopAnimations(),
        { provide: VehiclesService, useValue: vehiclesService },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
        { provide: ApiErrorService, useClass: ApiErrorService },
        {
          provide: ConfirmationService,
          useValue: { confirm: vi.fn().mockReturnValue(of(true)) },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(VehiclesListPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('AAA123');
    expect(text).toContain('Juan Perez');
    expect(vehiclesService.list).toHaveBeenCalled();
  });

  it('requests sorting by owner name when the user sorts that column', async () => {
    const vehiclesService = {
      list: vi.fn().mockReturnValue(
        of({
          items: [],
          meta: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            search: null,
            sortBy: 'dominio',
            sortDirection: 'asc',
          },
        }),
      ),
      remove: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [VehiclesListPageComponent],
      providers: [
        provideNoopAnimations(),
        { provide: VehiclesService, useValue: vehiclesService },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
        { provide: ApiErrorService, useClass: ApiErrorService },
        {
          provide: ConfirmationService,
          useValue: { confirm: vi.fn().mockReturnValue(of(true)) },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(VehiclesListPageComponent);
    const component = fixture.componentInstance;

    component.onSortChange({ active: 'titularNombre', direction: 'desc' });

    expect(vehiclesService.list).toHaveBeenLastCalledWith({
      page: 1,
      limit: 10,
      sortBy: 'titularNombre',
      sortDirection: 'desc',
    });
  });
});
