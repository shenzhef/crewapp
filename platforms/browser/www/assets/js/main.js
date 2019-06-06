var crew = (function() {
	"use strict";
	var rest_url = 'https://bigg.global/wp-json/capitanfitness/v0/crew';
	return {
		getTotals: function(list = false, name = false){
			if (list && name){
				var list = $(list);
				return {
					'total': list.find(name).length,
					'presents': list.find(name+'.checked').length,
					'absents': list.find(name+':not(.checked)').length
				}
			}
		},
		loadClasses: function() {
			var list = $('.list-classes');
			var node = list.find('li:not(.list-group-title)');
			node.remove();

			$.getJSON(rest_url + '/classes/720', function(results) {
				if(results && results.length > 0) {
					$.each(results, function(i, row) {
						var item = node.clone();
						item.data('calendar-id', row.id);
						item.find('.item-inner').addClass('no-left-margin');
						item.find('.item-class-time').html(row.inicio);
						item.find('.item-class-title').html(row.titulo);
						item.find('.item-class-role').html(row.rol);
						item.find('.item-class-box').html(row.box);
						item.find('.item-class-count').html(row.reservas + ' ' + (row.reservas == 1 ? 'persona anotada' : 'personas anotadas'));

						item.find('.item-class-checkin').data('calendar-id', row.id);
						if(row.checkin != null) item.find('.item-class-checkin').addClass('checked');

						item.on('click', '.item-class-time, .item-class-body', function() {
							app.views.main.router.navigate({
								name: 'class',
								params: {
									classId: $(this).parents('.item-class').data('calendar-id')
								}
							});
						});

						item.find('.item-class-checkin').on('click', function() {
							var row = $(this);
							if(!row.hasClass('checked') && !row.hasClass('waiting')) {
								var inicio = moment(row.inicio, 'H:m');
								var fin = moment(row.find, 'H:m');
								if(moment() >= inicio && moment() <= fin) {
									var checkin = confirm("Check-In?");
									if(checkin) {
										$.ajax({
											method: 'POST',
											url: rest_url + '/checkin/' + row.data('calendar-id'),
											beforeSend: function() {
												row.addClass('waiting');
											},
											success: function(response) {
												row.removeClass('waiting');
												if(response.class == 'success') {
													row.addClass('checked');
												} else {
													app.toast.show({ position: 'center', text: response.html, closeTimeout: 1500 });
												}
											}
										});
									}
								} else {
									app.toast.show({
										position: 'center',
										text: 'El checkin puede hacerse entre el inicio y el fin del bloque. Si te olvidaste, tu encargado de Box puede hacerlo por vos',
										closeTimeout: 5000
									});
								}
							}
						});
						$('.list-classes').append(item);
					});
				} else {
					var item = node.clone();
					item.find('.item-inner').html('Sin Clases Hoy');
					$('.list-classes').append(item);
				}
			});
		},
		loadBlocks: function() {
			var list = $('.list-blocks');
			var node = list.find('li:not(.list-group-title)');
			node.remove();

			$.getJSON(rest_url + '/blocks/720', function(results) {
				if(results && results.length > 0) {
					$.each(results, function(i, row) {
						var item = node.clone();
						item.find('.item-class-time').html(row.inicio + ' a ' + row.fin);
						item.find('.item-class-role').html(row.rol);
						item.find('.item-class-box').html(row.box);
						item.find('.item-class-checkin').data('calendar-id', row.calendar_id);
						$('.list-blocks').append(item);
					});
				} else {
					var item = node.clone();
					item.find('.item-inner').html('Sin Bloques Hoy');
					$('.list-blocks').append(item);
				}
			});


		},
		loadReservations: function(calendar_id) {
			var list = $('.list-reservations');
			var node = list.find('li:not(.item-divider)');
			node.remove();

			$.getJSON(rest_url + '/reservations/' + calendar_id, function(results) {
				if(results && results.length > 0) {
					$.each(results, function(i, row) {
						var item = node.clone();

						item.find('.item-reservation-name').html(row.nombre);

						item.find('.item-reservation-summary').append('Nivel: ' + row.reservas);
						if(row.reservas <= 16) item.find('.item-reservation-summary').append(' BIGGiner');
						if(row.cumple) item.find('.item-reservation-summary').append(' Cumple');
						if(row.cdp) item.find('.item-reservation-summary').append(' CDP');

						item.find('.item-reservation-attendance').data('reservation-id', row.id);
						if(row.asistencia == 1) item.find('.item-reservation-attendance').addClass('checked');

						item.find('.item-reservation-attendance').on('click', function() {
							var row = $(this);
							var status = row.hasClass('checked') ? 0 : 1;
							if (!row.hasClass('waiting')){
								$.ajax({
									method: 'POST',
									url: rest_url + '/attendance/' + row.data('reservation-id'),
									data: 'status=' + status,
									beforeSend: function() {
										row.removeClass('checked').addClass('waiting');
									},
									success: function(response) {
										row.removeClass('waiting');
										if(response.class == 'success') {
											if (status === 1) row.addClass('checked');
										} else {
											app.toast.show({ position: 'center', text: response.html, closeTimeout: 1500 });
										}
									}
								});
							}
						});
						item.find('.item-reservation-body')
							.data('data', JSON.stringify(row))
							.on('click', function(){
								var data = JSON.parse($(this).data('data'));
								var popup = app.popup.create({
									el: '.popup-user',
									swipeToClose: true,
								  on: {
								    open: function (popup){
											console.log($(popup));
											console.log($(this));

											$('.popup-user').find('.user-name').html(data.nombre);
								    }
								  }
								});
								popup.open();
							});

						$('.list-reservations').append(item);
						app.preloader.hide();

					});
					var count = crew().getTotals('.list-reservations', '.item-reservation-attendance');
					$('.items-count').html(count.total + ' Reservas | '+count.presents+' Presentes | '+count.absents+' Ausentes');
				}
			});
		},
		loadWeek: function() {
			app.preloader.show();
			var list = $('.list-week');
			var label = list.find('li.list-group-title');
			var node = list.find('li:not(.list-group-title)');
			label.remove();
			node.remove();

			$.getJSON(rest_url + '/week/720', function(results) {
				$.each(results, function(date, content) {
					var date = moment(date);
					var days_label = new Array('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo');

					var title = label.clone();
					title.html(days_label[date.isoWeekday()]+' '+date.date());
					list.append(title);

					if(content[1]) {
						$.each(content[1], function(i, row) {
							var item = node.clone();
							item.data('calendar-id', row.id);
							item.find('.item-inner').addClass('no-left-margin');
							item.find('.item-class-time').html(row.inicio);
							item.find('.item-class-title').html(row.titulo);
							item.find('.item-class-role').html(row.rol);
							item.find('.item-class-box').html(row.box);

							list.append(item);
						});
					}

				});
			});
			app.preloader.hide();

		},
		loadProgramming: function(date) {
			date = date || moment().format('YYYY-MM-DD');

			$.getJSON('https://biggfriends.com/wp-json/programming/v1/api/BIGGworkouts?date=' + date, function(results) {

				$.each(results, function(i, item) {
					var node = $('<li class="accordion-item "><a href="" class="item-link item-content prog-title"><div class="item-inner">' + item.title + '</div></a><div class="accordion-item-content"><div class="block"><ul class="ul-program"></ul></div></div></li>');
					if(item.content.length > 0) {
						$.each(item.content, function(c, row) {
							var li = $('<li class="workout">');
							if(row.title) li.append('<b>' + row.title + '</b><br>');
							if(row.content) {
								var content = '';
								$.each(row.content, function(e, exercise) {
									if(content) {
										content = content + '<br>' + exercise;
									} else {
										content = exercise;
									}

								});
								li.append(content + '<br>');
							}
							node.find('.ul-program').append(li);
						});
					}
					$('.list-programming').append(node);

				});
			});
			app.preloader.hide();

		}

	}
});

/* App */
var $$ = Dom7;
var app = new Framework7({
	root: '#app',
	language: 'es-ES',
	name: 'Capitán Fitness Crew',
	theme: 'ios',
	id: 'fitness.capitan.crew',
	routes: routes,
	navbar: {
    hideOnPageScroll: true
  },
	popup: {
		swipeToClose: true
	},
	dialog: {
		buttonCancel: 'Cancelar',
	},
	onAjaxStart: function(xhr) {
		app.preloader.show();
	},
	onAjaxComplete: function(xhr) {
		app.preloader.hide();
	}
});

var mainView = app.views.create('.view-main', { url: '/' });

/* Tabs */
$('#tab-classes').on('tab:init', function() {
	$('.button-profile').text(storage().get('userName'));
	crew().loadClasses();
	crew().loadBlocks();
});
$('#tab-week').on('tab:init', function() {
	crew().loadWeek();
});
$('#tab-programming').on('tab:init', function() {
	crew().loadProgramming();

	var calendarModal = app.calendar.create({
		inputEl: '#calendar',
		openIn: 'customModal',
		toolbarCloseText: 'Hecho',
		headerPlaceholder: 'Eliga una fecha',
		placeholder: "ss",
		header: true,
		footer: false,
		dateFormat: 'dd-mm-yyyy',
		monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
		monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Juñ', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
		dayNames: ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'],
		dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'],
		yearSelector: false,
		on: {
			calendarChange: function() {
				var date = moment(calendarModal.getValue()[0]).format('YYYY-MM-DD');
				app.preloader.show();
				$('.list-programming').fadeOut();
				$('.list-programming li').empty();
				crew(page.name).loadProgramming(date);
				calendarModal.close();
			},
		}
	});

	$('.programming-date').val(moment().format('DD-MM-YYYY'));
});

/* Pages */
$$(document).on('page:init', '.page[data-name="class"]', function(e, page) {
	app.preloader.show();
	var classId = e.detail.route.params['classId'];
	crew().loadReservations(classId);

	$('.ptr-content').on('ptr:refresh', function(e, page) {
		$('.reservations-count p').empty();
		$('.page[data-name="class"] .list-reservations li').fadeOut();
		crew('class').loadReservations(classId);
		app.ptr.done();
	});
});

/* Events */
$('.open-confirm').on('click', function() {
	app.dialog.confirm("Seguro desea cerrar sesion?", "Cierre de sesion", function() {
		storage().delete('crewtoken');
		localStorage.removeItem('crewtoken');
		app.panel.close();
		app.loginScreen.get('#main-login').open();

	});
});
