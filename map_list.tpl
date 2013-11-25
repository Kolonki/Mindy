<!doctype html>
<html>
<head>
	<title>Mindy - концептуальные карты онлайн</title>
	<meta charset="utf-8" />

	<!-- JQuery -->
	<script src="lib/jquery/jquery-1.9.1.min.js"></script>

	<!-- Bootstrap -->
	<link rel="stylesheet" href="lib/bootstrap/css/bootstrap.min.css" />
	<script src="lib/bootstrap/js/bootstrap.min.js"></script>

	<style>
	a, a:hover{
		color: black;
	}

	a:hover {
		font-weight: bold;
		text-decoration: underline;
	}

	h1 {
		text-align: center;
		margin: 20px;
	}

	body {
		margin-left: 20px;
	}

	i {
		visibility: hidden;
	}

	li:hover i {
		visibility: visible;
	}
	</style>

</head>
<body>

	<h1>MINDY - концептуальные карты онлайн</h1>

	<legend>Ваши карты</legend>
	<ul>
		%for map in maps:
		<li><a href="/maps?id={{ map['_id'] }}">{{ map['name'] }}</a> &nbsp;&nbsp;&nbsp;&nbsp;<a href="/deletemap?id={{ map['_id'] }}"><i class="icon-trash"></i></a></li>
		%end
	</ul>

	<form action="/newmap" method="POST">
	  <fieldset>
	    <legend>Новая концептуальная карта</legend>
	    <input type="text" name="name" placeholder="Название новой карты" /><br />
	    <button type="submit" class="btn">Создать</button>
	  </fieldset>
	</form>

</body>
</html>